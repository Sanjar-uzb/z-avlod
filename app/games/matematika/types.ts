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
  carId: string;
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
  rank?: number;
}

export interface MathRaceRoom {
  roomId: string;
  status: RaceStatus;
  gradeGroup: GradeGroup;
  totalQuestions: number;
  players: RacePlayer[];
  startedAt?: number;
  finishedAt?: number;
  hostId?: string;
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

export interface RaceEvent {
  type:
    | "PLAYER_JOINED"
    | "PLAYER_LEFT"
    | "RACE_READY"
    | "RACE_STARTED"
    | "ANSWER_SUBMIT"
    | "PLAYER_PROGRESS"
    | "PLAYER_FINISHED"
    | "RACE_FINISHED";
  payload?: Record<string, unknown>;
}

export interface AnswerFeedback {
  type: "success" | "error" | "timeout" | "info";
  text: string;
}
