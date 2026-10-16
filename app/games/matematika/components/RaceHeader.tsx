"use client";

import type { GradeGroup } from "../types";
import { formatScore } from "../lib/scoreUtils";

export interface RaceHeaderProps {
  gradeGroup: GradeGroup;
  roomId: string;
  score: number;
  combo: number;
  players: number;
}

export default function RaceHeader({ gradeGroup, roomId, score, combo, players }: RaceHeaderProps) {
  return (
    <header className="math-race-header">
      <div className="math-race-header-title">
        <span className="math-race-title">MATEMATIKA POYGASI</span>
        <span className="math-race-grade">{gradeGroup}-SINF</span>
      </div>

      <div className="math-race-header-meta">
        <span className="math-race-room">Room: {roomId}</span>
        <div className="math-race-pills">
          <div className="math-race-pill">
            <small>Ball</small>
            <strong>{formatScore(score)}</strong>
          </div>
          <div className="math-race-pill">
            <small>Combo</small>
            <strong>{Math.max(0, Math.round(combo))}</strong>
          </div>
          <div className="math-race-pill">
            <small>Players</small>
            <strong>{players}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
