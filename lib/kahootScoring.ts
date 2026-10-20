export type KahootScoreInput = {
  isCorrect: boolean;
  timeLeftSec: number;   // remaining seconds
  totalTimeSec: number;  // per question
};

export const KAHOOT_BASE_POINTS = 50;
export const KAHOOT_MAX_BONUS = 50;
export const KAHOOT_MAX_POINTS = KAHOOT_BASE_POINTS + KAHOOT_MAX_BONUS;

/**
 * 0..100 points per question.
 * Correct answer: 50 base + up to 50 speed bonus (linear in remaining time).
 * Wrong / timed-out: 0.
 */
export function scoreKahoot({ isCorrect, timeLeftSec, totalTimeSec }: KahootScoreInput) {
  if (!isCorrect) return { gained: 0, base: 0, bonus: 0 };

  const total = Number.isFinite(totalTimeSec) ? totalTimeSec : 0;
  const left = Number.isFinite(timeLeftSec) ? timeLeftSec : 0;

  const tl = Math.max(0, Math.min(left, total));
  const ratio = total > 0 ? tl / total : 0;
  const bonus = Math.floor(KAHOOT_MAX_BONUS * ratio);

  return { gained: KAHOOT_BASE_POINTS + bonus, base: KAHOOT_BASE_POINTS, bonus };
}

export function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${s}s`;
}
