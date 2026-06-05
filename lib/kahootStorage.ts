export type KahootAttempt = {
  id: string; // attempt id
  packId: string;
  packTitle: string;
  student: string;
  createdAt: string;

  totalQuestions: number;
  correct: number;
  score: number;

  details: Array<{
    qid: number;
    subject: string;
    correct: boolean;
    gained: number;
  }>;
};

const KEY = "zavlod_kahoot_attempts_v1";

export function saveKahootAttempt(attempt: KahootAttempt) {
  try {
    const arr = getKahootAttempts();
    arr.unshift(attempt);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50)));
  } catch {}
}

export function getKahootAttempts(): KahootAttempt[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearKahootAttempts() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
