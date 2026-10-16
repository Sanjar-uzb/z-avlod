import type { Difficulty, RacePlayer } from "../types";

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function formatScore(value: number): string {
  const safe = Math.round(Math.max(0, Number.isFinite(value) ? value : 0));
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatProgress(value: number): string {
  return `${Math.round(clampProgress(value))}%`;
}

export function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((correct / total) * 100)}%`;
}

// Speed bonus is based on how long the player actually took, not on a hard
// time limit. There is no countdown: answering after 30s is still accepted,
// it just earns the base score.
export function calculateSpeedBonus(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed <= 3) return 60;
  if (elapsed <= 7) return 35;
  return 10;
}

function difficultyBonus(difficulty: Difficulty): number {
  if (difficulty === "hard") return 2;
  if (difficulty === "medium") return 1;
  return 0;
}

export function calculateProgressGain(difficulty: Difficulty, elapsedSeconds: number): number {
  const base = 100 / 20;
  const speed =
    calculateSpeedBonus(elapsedSeconds) / 30 + difficultyBonus(difficulty);
  return Math.round(clampProgress(base + speed));
}

export function getAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateScoreDelta(
  correct: boolean,
  difficulty: Difficulty,
  elapsedSeconds: number,
  combo: number,
): number {
  if (!correct) return -20;

  const base = 100;
  const speedBonus = calculateSpeedBonus(elapsedSeconds);
  const comboBonus = combo >= 10 ? 100 : combo >= 5 ? 50 : combo >= 3 ? 25 : 0;
  const diffBonus = difficulty === "hard" ? 40 : difficulty === "medium" ? 20 : 0;
  return Math.round(base + speedBonus + comboBonus + diffBonus);
}

export function getRanking(players: RacePlayer[]): RacePlayer[] {
  return [...players].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    if (b.score !== a.score) return b.score - a.score;
    return a.averageAnswerTime - b.averageAnswerTime;
  });
}
