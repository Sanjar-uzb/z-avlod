import type { Difficulty, GradeGroup, MathQuestion } from "../types";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function answerMatches(submitted: string, expected: string): boolean {
  const input = normalizeAnswer(submitted);
  const answer = normalizeAnswer(expected);

  if (!input || !answer) return false;

  const normalizedAnswer = answer
    .replace(/\s* yoki \s*/g, "|")
    .replace(/\s*or\s*/g, "|")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\^/g, "^");

  const variants = normalizedAnswer.split("|").filter(Boolean);
  if (variants.length > 1) {
    return variants.some((variant) => normalizeAnswer(variant) === input);
  }

  if (expected.includes("±") || expected.includes("plus/minus")) {
    const base = expected.replace(/±|plus\/minus/gi, "").trim();
    return input === normalizeAnswer(base) || input === `-${normalizeAnswer(base)}`;
  }

  if (answer.includes("/")) {
    const expectedNumber = Number(answer);
    const inputNumber = Number(input);
    if (!Number.isNaN(expectedNumber) && !Number.isNaN(inputNumber)) {
      return Math.abs(expectedNumber - inputNumber) < 0.0001;
    }
  }

  if (!Number.isNaN(Number(answer)) && !Number.isNaN(Number(input))) {
    return Math.abs(Number(answer) - Number(input)) < 0.0001;
  }

  return input === normalizeAnswer(expected);
}

export function getTimeLimitByDifficulty(difficulty: Difficulty): number {
  if (difficulty === "easy") return 15;
  if (difficulty === "medium") return 20;
  return 30;
}

export function getRandomQuestions(
  questionPool: MathQuestion[],
  count: number,
  gradeGroup?: GradeGroup,
): MathQuestion[] {
  const filtered = gradeGroup
    ? questionPool.filter((question) => question.gradeGroup === gradeGroup)
    : questionPool;

  const totals = { easy: Math.round(count * 0.3), medium: Math.round(count * 0.4), hard: count - Math.round(count * 0.3) - Math.round(count * 0.4) };
  const byDifficulty = {
    easy: filtered.filter((question) => question.difficulty === "easy"),
    medium: filtered.filter((question) => question.difficulty === "medium"),
    hard: filtered.filter((question) => question.difficulty === "hard"),
  };

  const picked: MathQuestion[] = [];
  (Object.keys(totals) as Array<keyof typeof totals>).forEach((level) => {
    const target = totals[level];
    const candidates = shuffle(byDifficulty[level]);
    picked.push(...candidates.slice(0, Math.min(target, candidates.length)));
  });

  const selected = shuffle(picked).slice(0, count);
  const unique = new Map<number, MathQuestion>();
  selected.forEach((question) => unique.set(question.id, question));

  const finalList = [...unique.values()];
  if (finalList.length >= count) return shuffle(finalList).slice(0, count);

  const fallback = shuffle(filtered.filter((q) => !finalList.some((item) => item.id === q.id))).slice(0, count - finalList.length);
  return shuffle([...finalList, ...fallback]).slice(0, count);
}
