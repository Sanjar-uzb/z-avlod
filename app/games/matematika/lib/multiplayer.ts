import type { GradeGroup, MathRaceRoom, RacePlayer } from "../types";

const ROOM_STORAGE_KEY = "zavlod_math_race_rooms_v1";
const ROOM_CHANNEL_NAME = "zavlod_math_race_channel";
const CAR_SET = ["🚗", "🏎️", "🚙", "🚕", "🚓", "🚐", "🚖", "🚘", "🚑", "🚌"];

function readRooms(): Record<string, MathRaceRoom> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(ROOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeRooms(rooms: Record<string, MathRaceRoom>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(rooms));
  if ("BroadcastChannel" in window) {
    const channel = new window.BroadcastChannel(ROOM_CHANNEL_NAME);
    channel.postMessage({ type: "ROOM_SYNC", rooms });
    channel.close();
  }
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(progress) ? progress : 0)));
}

function nextCarId(players: RacePlayer[]): string {
  const used = new Set(players.map((player) => player.carId));
  return CAR_SET.find((car) => !used.has(car)) || `car-${players.length + 1}`;
}

export function generateRoomId(): string {
  return `MATH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function readMathRaceRoom(roomId: string): MathRaceRoom | null {
  const rooms = readRooms();
  return rooms[roomId] || null;
}

export function joinMathRaceRoom({
  roomId,
  gradeGroup,
  playerName,
  playerId,
}: {
  roomId: string;
  gradeGroup: GradeGroup;
  playerName: string;
  playerId?: string;
}): { room: MathRaceRoom; player: RacePlayer } {
  const rooms = readRooms();
  const safeRoomId = roomId.trim() || generateRoomId();
  const room = rooms[safeRoomId] || {
    roomId: safeRoomId,
    gradeGroup,
    status: "waiting",
    totalQuestions: 20,
    players: [],
    startedAt: undefined,
    finishedAt: undefined,
    hostId: undefined,
  };

  const safeName = (playerName || "Foydalanuvchi").trim() || "Foydalanuvchi";
  const existing = room.players.find((player) => player.id === playerId);

  const player: RacePlayer = existing
    ? {
        ...existing,
        name: safeName,
        connected: true,
        progress: clampProgress(existing.progress),
        score: Math.round(Number(existing.score) || 0),
        correctAnswers: Number(existing.correctAnswers) || 0,
        wrongAnswers: Number(existing.wrongAnswers) || 0,
        combo: Math.max(0, Number(existing.combo) || 0),
        maxCombo: Math.max(0, Number(existing.maxCombo) || 0),
        currentQuestion: Number(existing.currentQuestion) || 0,
        finished: Boolean(existing.finished),
      }
    : {
        id: playerId || `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: safeName,
        carId: nextCarId(room.players),
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
      };

  const remaining = room.players.filter((existingPlayer) => existingPlayer.id !== player.id);
  const updatedRoom: MathRaceRoom = {
    ...room,
    roomId: safeRoomId,
    gradeGroup,
    totalQuestions: 20,
    players: [...remaining, { ...player, connected: true }],
    hostId: room.hostId || player.id,
  };

  rooms[safeRoomId] = updatedRoom;
  writeRooms(rooms);

  return { room: updatedRoom, player };
}

export function leaveMathRaceRoom(roomId: string, playerId: string) {
  const rooms = readRooms();
  const room = rooms[roomId];
  if (!room) {
    return null;
  }

  const nextRoom: MathRaceRoom = {
    ...room,
    players: room.players.map((player) =>
      player.id === playerId ? { ...player, connected: false, finished: true } : player,
    ),
  };

  if (nextRoom.hostId === playerId) {
    const connectedPlayer = nextRoom.players.find((player) => player.connected);
    nextRoom.hostId = connectedPlayer?.id || nextRoom.players[0]?.id;
  }

  rooms[roomId] = nextRoom;
  writeRooms(rooms);

  return nextRoom;
}

export function updateMathRaceRoom(roomId: string, nextRoom: MathRaceRoom) {
  const rooms = readRooms();
  rooms[roomId] = nextRoom;
  writeRooms(rooms);
  return nextRoom;
}

export function subscribeToRoom(roomId: string, callback: (room: MathRaceRoom | null) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const currentRoom = readMathRaceRoom(roomId);
  callback(currentRoom);

  const channel = "BroadcastChannel" in window ? new window.BroadcastChannel(ROOM_CHANNEL_NAME) : null;

  const handleMessage = (event: MessageEvent) => {
    const rooms = event.data?.rooms || {};
    callback(rooms[roomId] || null);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === ROOM_STORAGE_KEY) {
      callback(readMathRaceRoom(roomId));
    }
  };

  channel?.addEventListener("message", handleMessage);
  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.removeEventListener("message", handleMessage);
    window.removeEventListener("storage", handleStorage);
    channel?.close();
  };
}
