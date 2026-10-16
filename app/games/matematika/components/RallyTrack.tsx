"use client";

import type { CSSProperties } from "react";
import type { RacePlayer } from "../types";
import { getRanking } from "../lib/scoreUtils";
import { isPlayerActive } from "../lib/mathRaceLogic";
import RallyCar from "./RallyCar";

const CAR_COLORS = [
  "#e63946",
  "#3a86ff",
  "#ffbe0b",
  "#2a9d8f",
  "#f1faee",
  "#fb5607",
  "#8338ec",
  "#00b4d8",
  "#ff006e",
  "#8ac926",
  "#ff7d00",
  "#4cc9f0",
];

export interface RallyTrackProps {
  players: RacePlayer[];
  selfId: string;
  nowMs?: number;
}

export default function RallyTrack({ players, selfId, nowMs }: RallyTrackProps) {
  const ranked = getRanking(players);
  const rankById = new Map(ranked.map((player, index) => [player.id, index + 1]));
  const laneCount = Math.max(1, players.length);

  return (
    <section className="math-race-track" aria-label="Ralli trassasi">
      <div className="math-race-road">
        <div className="math-race-lanes" style={{ "--lane-count": laneCount } as CSSProperties}>
          {players.map((player, index) => (
            <div className="math-race-lane" key={player.id}>
              <RallyCar
                playerName={player.name}
                color={CAR_COLORS[index % CAR_COLORS.length]}
                progress={player.progress}
                isSelf={player.id === selfId}
                finished={player.finished}
                connected={nowMs === undefined ? player.connected !== false : isPlayerActive(player, nowMs)}
                rank={rankById.get(player.id)}
              />
            </div>
          ))}
        </div>

        <div className="math-race-marker math-race-marker-start" aria-hidden="true">
          <span>START</span>
        </div>
        <div className="math-race-marker math-race-marker-finish" aria-hidden="true">
          <span>🏁</span>
        </div>
      </div>
    </section>
  );
}
