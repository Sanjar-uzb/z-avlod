import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import type { TxtQuestion } from "@/lib/kahootText";

export type RoomState = {
  pin: string;
  title: string;
  phase: "LOBBY" | "QUESTION" | "RESULT" | "FINISHED";
  qIndex: number;
  timePerQuestionSec: number;
  startedAtMs: number | null;
  questions: TxtQuestion[];
  createdAt?: any;
};

export type Player = {
  name: string;
  score: number;
  joinedAtMs: number;
  lastAnswer?: {
    qid: number;
    pickedId: number;
    correct: boolean;
    gained: number;
    tLeftSec: number;
  };
};

function genPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createRoom(payload: {
  title: string;
  timePerQuestionSec: number;
  questions: TxtQuestion[];
}) {
  let pin = genPin();

  for (let i = 0; i < 5; i++) {
    const roomRef = doc(db, "kahootRooms", pin);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      const state: RoomState = {
        pin,
        title: payload.title || "Kahoot Live",
        phase: "LOBBY",
        qIndex: 0,
        timePerQuestionSec: payload.timePerQuestionSec || 15,
        startedAtMs: null,
        questions: payload.questions,
        createdAt: serverTimestamp(),
      };

      await setDoc(roomRef, state);
      return pin;
    }

    pin = genPin();
  }

  throw new Error("PIN yaratib bo‘lmadi, qayta urinib ko‘ring.");
}

export async function roomExists(pin: string) {
  const roomRef = doc(db, "kahootRooms", pin);
  const snap = await getDoc(roomRef);
  return snap.exists();
}

export function listenRoom(pin: string, cb: (s: RoomState | null) => void) {
  const roomRef = doc(db, "kahootRooms", pin);
  return onSnapshot(roomRef, (snap) => {
    cb(snap.exists() ? (snap.data() as RoomState) : null);
  });
}

export function listenPlayers(
  pin: string,
  cb: (players: Array<{ id: string; data: Player }>) => void
) {
  const colRef = collection(db, "kahootRooms", pin, "players");
  return onSnapshot(colRef, (snap) => {
    const arr = snap.docs
      .map((d) => ({ id: d.id, data: d.data() as Player }))
      .sort((a, b) => (b.data.score || 0) - (a.data.score || 0));
    cb(arr);
  });
}

export async function joinRoom(pin: string, name: string) {
  const colRef = collection(db, "kahootRooms", pin, "players");
  const docRef = await addDoc(colRef, {
    name,
    score: 0,
    joinedAtMs: Date.now(),
  } satisfies Player);

  return docRef.id;
}

export async function startQuestion(pin: string) {
  const roomRef = doc(db, "kahootRooms", pin);
  await updateDoc(roomRef, {
    phase: "QUESTION",
    startedAtMs: Date.now(),
  });
}

export async function showResult(pin: string) {
  const roomRef = doc(db, "kahootRooms", pin);
  await updateDoc(roomRef, { phase: "RESULT" });
}

export async function nextQuestion(pin: string) {
  const roomRef = doc(db, "kahootRooms", pin);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as RoomState;
  const next = room.qIndex + 1;

  if (next >= room.questions.length) {
    await updateDoc(roomRef, { phase: "FINISHED" });
  } else {
    await updateDoc(roomRef, {
      qIndex: next,
      phase: "QUESTION",
      startedAtMs: Date.now(),
    });
  }
}

export async function submitAnswer(
  pin: string,
  playerId: string,
  payload: {
    qid: number;
    pickedId: number;
    correct: boolean;
    gained: number;
    tLeftSec: number;
  }
) {
  const pRef = doc(db, "kahootRooms", pin, "players", playerId);
  const snap = await getDoc(pRef);
  if (!snap.exists()) return { ok: false, reason: "player-not-found" };

  const p = snap.data() as Player;

  // bir savolga faqat 1 marta
  if (p.lastAnswer?.qid === payload.qid) {
    return { ok: false, reason: "already-answered" };
  }

  await updateDoc(pRef, {
    score: (p.score || 0) + payload.gained,
    lastAnswer: payload,
  });

  return { ok: true };
}