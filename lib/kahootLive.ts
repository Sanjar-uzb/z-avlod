import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type { TxtQuestion } from "@/lib/kahootText";
import { scoreKahoot } from "@/lib/kahootScoring";

export type RoomPhase = "LOBBY" | "QUESTION" | "RESULT" | "FINISHED";

export type RoomState = {
  pin: string;
  title: string;
  phase: RoomPhase;
  qIndex: number;
  timePerQuestionSec: number;
  startedAtMs: number | null;
  resultAtMs: number | null;
  questions: TxtQuestion[];
  createdAt?: unknown;
};

export type PlayerAnswer = {
  qid: number;
  pickedId: number;
  correct: boolean;
  gained: number;
  tLeftSec: number;
};

export type Player = {
  name: string;
  score: number;
  correct?: number;
  joinedAtMs: number;
  lastAnswer?: PlayerAnswer;
};

export type PlayerEntry = { id: string; data: Player };

export type ActionResult =
  | { ok: true }
  | { ok: false; reason: string };

export type SubmitAnswerResult =
  | { ok: true; correct: boolean; gained: number; tLeftSec: number }
  | { ok: false; reason: string };

export type JoinRoomResult =
  | { ok: true; playerId: string; name: string }
  | { ok: false; reason: string };

function genPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function roomRef(pin: string) {
  return doc(db, "kahootRooms", pin);
}

function playersCol(pin: string) {
  return collection(db, "kahootRooms", pin, "players");
}

function playerRef(pin: string, playerId: string) {
  return doc(db, "kahootRooms", pin, "players", playerId);
}

export async function createRoom(payload: {
  title: string;
  timePerQuestionSec: number;
  questions: TxtQuestion[];
}) {
  let pin = genPin();

  for (let i = 0; i < 5; i++) {
    const ref = roomRef(pin);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const timePerQuestionSec =
        Number.isFinite(payload.timePerQuestionSec) && payload.timePerQuestionSec > 0
          ? Math.min(120, Math.round(payload.timePerQuestionSec))
          : 15;

      const state: RoomState = {
        pin,
        title: (payload.title || "Kahoot Live").trim().slice(0, 120) || "Kahoot Live",
        phase: "LOBBY",
        qIndex: 0,
        timePerQuestionSec,
        startedAtMs: null,
        resultAtMs: null,
        questions: payload.questions,
        createdAt: serverTimestamp(),
      };

      await setDoc(ref, state);
      return pin;
    }

    pin = genPin();
  }

  throw new Error("PIN yaratib bo‘lmadi, qayta urinib ko‘ring.");
}

export async function roomExists(pin: string) {
  const snap = await getDoc(roomRef(pin));
  return snap.exists();
}

export function listenRoom(
  pin: string,
  cb: (s: RoomState | null) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    roomRef(pin),
    (snap) => cb(snap.exists() ? (snap.data() as RoomState) : null),
    (err) => onError?.(err)
  );
}

/**
 * Stable ranking: score desc -> correct desc -> joined earlier first -> name.
 * Sorting only by score caused the podium/order to jump around when scores tied.
 */
export function sortPlayers(players: PlayerEntry[]) {
  return [...players].sort((a, b) => {
    const byScore = (b.data.score || 0) - (a.data.score || 0);
    if (byScore !== 0) return byScore;

    const byCorrect = (b.data.correct || 0) - (a.data.correct || 0);
    if (byCorrect !== 0) return byCorrect;

    const byJoined = (a.data.joinedAtMs || 0) - (b.data.joinedAtMs || 0);
    if (byJoined !== 0) return byJoined;

    return (a.data.name || "").localeCompare(b.data.name || "");
  });
}

export function listenPlayers(
  pin: string,
  cb: (players: PlayerEntry[]) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    playersCol(pin),
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, data: d.data() as Player }));
      cb(sortPlayers(arr));
    },
    (err) => onError?.(err)
  );
}

/**
 * Join (or resume) as a player.
 * - Passing `existingPlayerId` (stored in sessionStorage) updates the name instead
 *   of creating a duplicate player row on refresh.
 * - New players may only join while the room is in LOBBY.
 */
export async function joinRoom(
  pin: string,
  name: string,
  existingPlayerId?: string
): Promise<JoinRoomResult> {
  const cleanName = name.trim().replace(/\s+/g, " ").slice(0, 40);
  if (cleanName.length < 2) return { ok: false, reason: "invalid-name" };

  const snap = await getDoc(roomRef(pin));
  if (!snap.exists()) return { ok: false, reason: "room-not-found" };

  const room = snap.data() as RoomState;

  if (existingPlayerId) {
    const ref = playerRef(pin, existingPlayerId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await setDoc(ref, { name: cleanName }, { merge: true });
      return { ok: true, playerId: existingPlayerId, name: cleanName };
    }
  }

  if (room.phase !== "LOBBY") return { ok: false, reason: "game-started" };

  const ref = doc(playersCol(pin));
  const player: Player = {
    name: cleanName,
    score: 0,
    correct: 0,
    joinedAtMs: Date.now(),
  };

  await setDoc(ref, player);
  return { ok: true, playerId: ref.id, name: cleanName };
}

export async function startQuestion(pin: string): Promise<ActionResult> {
  const ref = roomRef(pin);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { ok: false, reason: "room-not-found" };

    const room = snap.data() as RoomState;
    if (room.phase !== "LOBBY") return { ok: false, reason: "not-lobby" };
    if (!room.questions?.length) return { ok: false, reason: "no-questions" };

    tx.update(ref, {
      phase: "QUESTION",
      qIndex: 0,
      startedAtMs: Date.now(),
      resultAtMs: null,
    });

    return { ok: true };
  });
}

/**
 * Move QUESTION -> RESULT.
 * Host auto-call (force=false) only succeeds once the timer has expired.
 * Host manual "Natijani ko‘rsatish" uses force=true.
 */
export async function showResult(
  pin: string,
  opts?: { force?: boolean }
): Promise<ActionResult> {
  const ref = roomRef(pin);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { ok: false, reason: "room-not-found" };

    const room = snap.data() as RoomState;
    if (room.phase !== "QUESTION") return { ok: false, reason: "not-question" };

    const total = room.timePerQuestionSec || 15;
    const started = room.startedAtMs || 0;
    const expired = Date.now() >= started + total * 1000;

    if (!expired && !opts?.force) return { ok: false, reason: "not-expired" };

    tx.update(ref, { phase: "RESULT", resultAtMs: Date.now() });
    return { ok: true };
  });
}

/**
 * Move RESULT -> next QUESTION, or -> FINISHED after the last question.
 * `expectedQIndex` makes concurrent host tabs/timers idempotent.
 */
export async function nextQuestion(
  pin: string,
  expectedQIndex?: number
): Promise<ActionResult> {
  const ref = roomRef(pin);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { ok: false, reason: "room-not-found" };

    const room = snap.data() as RoomState;
    if (room.phase !== "RESULT") return { ok: false, reason: "not-result" };
    if (typeof expectedQIndex === "number" && room.qIndex !== expectedQIndex) {
      return { ok: false, reason: "stale" };
    }

    const next = room.qIndex + 1;

    if (next >= (room.questions?.length || 0)) {
      tx.update(ref, { phase: "FINISHED", resultAtMs: Date.now() });
    } else {
      tx.update(ref, {
        qIndex: next,
        phase: "QUESTION",
        startedAtMs: Date.now(),
        resultAtMs: null,
      });
    }

    return { ok: true };
  });
}

/**
 * Score is derived from the authoritative room document, not from client-sent
 * `correct`/`gained` values. Still client-trusted in the sense that a modified
 * client could write directly to Firestore without auth (see docs).
 */
export async function submitAnswer(
  pin: string,
  playerId: string,
  payload: { qid: number; pickedId: number }
): Promise<SubmitAnswerResult> {
  if (!playerId) return { ok: false, reason: "player-not-found" };

  const rRef = roomRef(pin);
  const pRef = playerRef(pin, playerId);

  return runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(rRef);
    if (!roomSnap.exists()) return { ok: false, reason: "room-not-found" };

    const room = roomSnap.data() as RoomState;
    if (room.phase !== "QUESTION") return { ok: false, reason: "not-question" };

    const playerSnap = await tx.get(pRef);
    if (!playerSnap.exists()) return { ok: false, reason: "player-not-found" };

    const player = playerSnap.data() as Player;
    const q = room.questions?.[room.qIndex];
    if (!q) return { ok: false, reason: "no-question" };

    if (Number(payload.qid) !== q.id) return { ok: false, reason: "stale-question" };

    if (player.lastAnswer && player.lastAnswer.qid === q.id) {
      return { ok: false, reason: "already-answered" };
    }

    const total = room.timePerQuestionSec || 15;
    const started = room.startedAtMs || 0;
    const elapsed = (Date.now() - started) / 1000;

    if (!Number.isFinite(elapsed) || elapsed < 0) {
      return { ok: false, reason: "not-started" };
    }
    // small grace for network latency; host forcing RESULT still blocks late answers
    if (elapsed > total + 0.5) return { ok: false, reason: "too-late" };

    const timeLeftSec = Math.max(0, total - elapsed);
    const correct = Number(payload.pickedId) === q.answerId;
    const scored = scoreKahoot({
      isCorrect: correct,
      timeLeftSec,
      totalTimeSec: total,
    });

    const answer: PlayerAnswer = {
      qid: q.id,
      pickedId: Number(payload.pickedId),
      correct,
      gained: scored.gained,
      tLeftSec: timeLeftSec,
    };

    tx.update(pRef, {
      score: (player.score || 0) + scored.gained,
      correct: (player.correct || 0) + (correct ? 1 : 0),
      lastAnswer: answer,
    });

    return { ok: true, correct, gained: scored.gained, tLeftSec: timeLeftSec };
  });
}
