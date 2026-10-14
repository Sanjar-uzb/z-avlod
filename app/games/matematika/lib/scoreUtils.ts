import type { Difficulty, RacePlayer } from "../types";
import { getTimeLimitByDifficulty } from "./questionUtils";

export function formatScore(value: number): string {
  return Math.round(Math.max(0, Number.isFinite(value) ? value : 0)).toLocaleString("uz-UZ");
}

export function formatProgress(value: number): string {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return `${Math.round(normalized)}%`;
}

export function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
}

export function calculateSpeedBonus(difficulty: Difficulty, elapsedSeconds: number): number {
  const limit = getTimeLimitByDifficulty(difficulty);
  const ratio = Math.max(0, (limit - elapsedSeconds) / limit);
  return Math.round(ratio * 50);
}

export function calculateProgressGain(difficulty: Difficulty, elapsedSeconds: number): number {
  const base = 100 / 20;
  const speedBonus = Math.max(0, (getTimeLimitByDifficulty(difficulty) - elapsedSeconds) * 0.4);
  const total = base + speedBonus / 5;
  return Math.round(Math.min(100, total));
}

export function getAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateScoreDelta(correct: boolean, difficulty: Difficulty, elapsedSeconds: number, combo: number): number {
  if (!correct) return -20;

  const base = 100;
  const speedBonus = calculateSpeedBonus(difficulty, elapsedSeconds);
  const comboBonus = combo >= 10 ? 100 : combo >= 5 ? 50 : combo >= 3 ? 25 : 0;
  return Math.round(base + speedBonus + comboBonus);
}

export function getRanking(players: RacePlayer[]): RacePlayer[] {
  return [...players].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    if (b.score !== a.score) return b.score - a.score;
    return a.averageAnswerTime - b.averageAnswerTime;
  });
}
