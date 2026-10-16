import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { GradeGroup, RacePlayer, RaceRoomDoc } from "../types";
import {
  STALE_CLEAN_MS,
  debugLog,
  dedupePlayersById,
  isValidRoomId,
  normalizeRoomId,
  toRacePlayer,
} from "./mathRaceLogic";

const ROOMS_COLLECTION = "mathRaceRooms";

export type JoinErrorCode =
  | "invalid-room"
  | "grade-mismatch"
  | "permission"
  | "unavailable"
  | "unknown";

export type JoinResult =
  | { ok: true; roomId: string; gradeGroup: GradeGroup }
  | { ok: false; code: JoinErrorCode; message: string };

export type SubscribeHandlers = {
  onPlayers: (players: RacePlayer[]) => void;
  onError?: (error: unknown) => void;
};

class GradeMismatchError extends Error {
  constructor(public readonly gradeGroup: GradeGroup) {
    super("grade-mismatch");
    this.name = "GradeMismatchError";
  }
}

export function generateRoomId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let index = 0; index < 5; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MATH-${suffix}`;
}

function firestoreErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : "";
  }
  return "";
}

function classifyError(error: unknown, fallbackMessage: string): JoinResult {
  const code = firestoreErrorCode(error);
  if (code === "permission-denied") {
    return {
      ok: false,
      code: "permission",
      message:
        "Serverga ulanib bo'lmadi: `mathRaceRooms` kolleksiyasi uchun Firestore ruxsatlari sozlanmagan. Hujjatlarga qarang.",
    };
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return {
      ok: false,
      code: "unavailable",
      message: "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.",
    };
  }
  return { ok: false, code: "unknown", message: fallbackMessage };
}

export async function joinRaceRoom(input: {
  roomId: string;
  gradeGroup: GradeGroup;
  playerId: string;
  playerName: string;
}): Promise<JoinResult> {
  const id = normalizeRoomId(input.roomId);
  if (!isValidRoomId(id)) {
    return {
      ok: false,
      code: "invalid-room",
      message:
        "Room ID noto'g'ri (3-40 belgi, `/`, `.`, `[`, `]` belgilarisiz). Masalan: MATH-60",
    };
  }

  const name = input.playerName.trim() || "O'yinchi";
  const roomRef = doc(db, ROOMS_COLLECTION, id);
  const playerRef = doc(db, ROOMS_COLLECTION, id, "players", input.playerId);

  try {
    await runTransaction(db, async (transaction) => {
      const nowMs = Date.now();
      const roomSnapshot = await transaction.get(roomRef);

      if (!roomSnapshot.exists()) {
        const roomDoc: RaceRoomDoc = {
          roomId: id,
          gradeGroup: input.gradeGroup,
          totalQuestions: 20,
          hostId: input.playerId,
          createdAtMs: nowMs,
        };
        transaction.set(roomRef, roomDoc);
        debugLog("ROOM", `Creating room: ${id} (${input.gradeGroup})`);
      } else {
        const existing = roomSnapshot.data() as Partial<RaceRoomDoc>;
        if (existing.gradeGroup && existing.gradeGroup !== input.gradeGroup) {
          throw new GradeMismatchError(existing.gradeGroup);
        }
      }

      const playerDoc: Partial<RacePlayer> = {
        id: input.playerId,
        name,
        roomId: id,
        gradeGroup: input.gradeGroup,
        progress: 0,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentQuestion: 0,
        combo: 0,
        maxCombo: 0,
        totalAnswerTime: 0,
        averageAnswerTime: 0,
        finished: false,
        connected: true,
        joinedAtMs: nowMs,
        lastSeenAtMs: nowMs,
      };
      transaction.set(playerRef, playerDoc, { merge: true });
    });

    debugLog("ROOM", `Joined room: ${id} as ${name}`);
    return { ok: true, roomId: id, gradeGroup: input.gradeGroup };
  } catch (error) {
    if (error instanceof GradeMismatchError) {
      return {
        ok: false,
        code: "grade-mismatch",
        message: `Bu room boshqa sinf (${error.gradeGroup}) uchun ochilgan. Boshqa sinfni tanlang yoki boshqa Room ID kiriting.`,
      };
    }
    return classifyError(error, "Roomga qo'shilish amalga oshmadi. Qayta urinib ko'ring.");
  }
}

export function subscribeRaceRoom(roomId: string, handlers: SubscribeHandlers): () => void {
  const id = normalizeRoomId(roomId);
  const playersRef = collection(db, ROOMS_COLLECTION, id, "players");
  debugLog("ROOM", `Subscribing to room: ${id}`);

  return onSnapshot(
    playersRef,
    (snapshot) => {
      const players = dedupePlayersById(
        snapshot.docs.map((document) => toRacePlayer(document.id, document.data() as Partial<RacePlayer>)),
      );
      debugLog("ROOM", `Presence sync: ${players.length} player(s)`);
      handlers.onPlayers(players);
    },
    (error) => {
      console.error("[ROOM] Snapshot error:", error);
      handlers.onError?.(error);
    },
  );
}

export async function pushPlayerState(
  roomId: string,
  playerId: string,
  patch: Partial<RacePlayer>,
): Promise<void> {
  const id = normalizeRoomId(roomId);
  const playerRef = doc(db, ROOMS_COLLECTION, id, "players", playerId);
  await setDoc(playerRef, { ...patch, lastSeenAtMs: Date.now() }, { merge: true });
}

export async function markPlayerLeft(roomId: string, playerId: string): Promise<void> {
  const id = normalizeRoomId(roomId);
  const nowMs = Date.now();
  const playerRef = doc(db, ROOMS_COLLECTION, id, "players", playerId);
  await updateDoc(playerRef, { connected: false, lastSeenAtMs: nowMs, leftAtMs: nowMs });
  debugLog("PLAYER", `Left: ${playerId}`);
}

export async function cleanupStalePlayers(roomId: string): Promise<void> {
  const id = normalizeRoomId(roomId);
  const playersRef = collection(db, ROOMS_COLLECTION, id, "players");
  const cutoff = Date.now() - STALE_CLEAN_MS;
  const snapshot = await getDocs(query(playersRef, where("lastSeenAtMs", "<", cutoff)));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((document) => batch.delete(document.ref));
  await batch.commit();
  debugLog("ROOM", `Cleaned up ${snapshot.size} stale player(s)`);
}
