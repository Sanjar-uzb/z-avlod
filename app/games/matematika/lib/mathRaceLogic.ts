import type { RacePlayer } from "../types";

export const STALE_AFTER_MS = 45_000;
export const STALE_CLEAN_MS = 10 * 60_000;
export const HEARTBEAT_MS = 20_000;

export function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

export function isValidRoomId(roomId: string): boolean {
  const id = normalizeRoomId(roomId);
  if (id.length < 3 || id.length > 40) return false;
  if (/[/.[\]]/.test(id)) return false;
  if (id === "." || id === ".." || /^__.*__$/.test(id)) return false;
  return true;
}

export function createPlayerId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeNumber(value: unknown, min = 0): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.round(number));
}

export function sanitizeProgress(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function toRacePlayer(docId: string, data: Partial<RacePlayer>): RacePlayer {
  return {
    id: docId,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "O'yinchi",
    roomId: data.roomId,
    gradeGroup: data.gradeGroup,
    progress: sanitizeProgress(data.progress),
    score: sanitizeNumber(data.score),
    correctAnswers: sanitizeNumber(data.correctAnswers),
    wrongAnswers: sanitizeNumber(data.wrongAnswers),
    currentQuestion: sanitizeNumber(data.currentQuestion),
    combo: sanitizeNumber(data.combo),
    maxCombo: sanitizeNumber(data.maxCombo),
    totalAnswerTime: Math.max(0, Number(data.totalAnswerTime) || 0),
    averageAnswerTime: Math.max(0, Number(data.averageAnswerTime) || 0),
    finished: Boolean(data.finished),
    connected: data.connected !== false,
    joinedAtMs: Number(data.joinedAtMs) || 0,
    lastSeenAtMs: Number(data.lastSeenAtMs) || 0,
  };
}

export function dedupePlayersById(players: RacePlayer[]): RacePlayer[] {
  const byId = new Map<string, RacePlayer>();
  for (const player of players) {
    if (!player || !player.id) continue;
    const previous = byId.get(player.id);
    if (!previous || (player.lastSeenAtMs ?? 0) >= (previous.lastSeenAtMs ?? 0)) {
      byId.set(player.id, player);
    }
  }
  return Array.from(byId.values());
}

export function lastSeenOf(player: RacePlayer): number {
  return player.lastSeenAtMs || player.joinedAtMs || 0;
}

export function isPlayerActive(player: RacePlayer, nowMs: number): boolean {
  if (player.connected === false) return false;
  return nowMs - lastSeenOf(player) <= STALE_AFTER_MS;
}

export function isPlayerStale(player: RacePlayer, nowMs: number): boolean {
  if (player.connected === false) return false;
  return nowMs - lastSeenOf(player) > STALE_AFTER_MS;
}

export function shouldDropPlayer(player: RacePlayer, nowMs: number): boolean {
  return nowMs - lastSeenOf(player) > STALE_CLEAN_MS;
}

export function createSelfPlayer(input: {
  playerId: string;
  name: string;
  roomId: string;
  gradeGroup: RacePlayer["gradeGroup"];
}): RacePlayer {
  const nowMs = Date.now();
  return {
    id: input.playerId,
    name: input.name,
    roomId: input.roomId,
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
}

export function mergeRoster(
  serverPlayers: RacePlayer[],
  previousPlayers: RacePlayer[],
  selfId: string,
): RacePlayer[] {
  if (serverPlayers.some((player) => player.id === selfId)) return serverPlayers;
  const self = previousPlayers.find((player) => player.id === selfId);
  return self ? [...serverPlayers, self] : serverPlayers;
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function debugLog(
  tag: "ROOM" | "PLAYER" | "RACE",
  message: string,
  extra?: unknown,
): void {
  if (!isDevMode()) return;
  const line = `[${tag}] ${message}`;
  if (extra === undefined) console.log(line);
  else console.log(line, extra);
}
