export type GradeGroup = "5-6" | "7-9";
export type Difficulty = "easy" | "medium" | "hard";
export type RaceStatus = "waiting" | "countdown" | "racing" | "finished";

export interface MathQuestion {
  id: number;
  gradeGroup: GradeGroup;
  difficulty: Difficulty;
  question: string;
  answer: string;
  explanation?: string;
  category: string;
}

export interface RacePlayer {
  id: string;
  name: string;
  roomId?: string;
  gradeGroup?: GradeGroup;
  progress: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentQuestion: number;
  combo: number;
  maxCombo: number;
  totalAnswerTime: number;
  averageAnswerTime: number;
  finished: boolean;
  connected: boolean;
  joinedAtMs?: number;
  lastSeenAtMs?: number;
  rank?: number;
}

export interface RaceRoomDoc {
  roomId: string;
  gradeGroup: GradeGroup;
  totalQuestions: number;
  hostId?: string;
  createdAtMs?: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  accuracy: number;
  bestTime: number;
  grade: GradeGroup;
  savedAt: number;
  gamesPlayed: number;
}
