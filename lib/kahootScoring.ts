export type KahootScoreInput = {
  isCorrect: boolean;
  timeLeftSec: number;   // remaining seconds
  totalTimeSec: number;  // per question
};

export function scoreKahoot({ isCorrect, timeLeftSec, totalTimeSec }: KahootScoreInput) {
  if (!isCorrect) return { gained: 0, base: 0, bonus: 0 };

  const base = 1000;
  const tl = Math.max(0, Math.min(timeLeftSec, totalTimeSec));
  const ratio = totalTimeSec > 0 ? tl / totalTimeSec : 0;
  const bonus = Math.floor(1000 * ratio);

  return { gained: base + bonus, base, bonus };
}

export function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${s}s`;
}
