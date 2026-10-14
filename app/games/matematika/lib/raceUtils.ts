import type { GradeGroup, RacePlayer } from "../types";

export const CAR_SET = ["🚗", "🏎️", "🚙", "🚕", "🚓", "🚐"];

export function buildPlayers(playerName: string, gradeGroup: GradeGroup): RacePlayer[] {
  void gradeGroup;

  return [
    {
      id: "player",
      name: playerName || "Siz",
      carId: "🚗",
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
    },
  ];
}

export function updateBotProgress(players: RacePlayer[]) {
  return players;
}
