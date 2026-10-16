"use client";

import type { CSSProperties } from "react";

export interface RallyCarProps {
  playerName: string;
  color: string;
  progress: number;
  isSelf?: boolean;
  finished?: boolean;
  rank?: number;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function RallyCar({
  playerName,
  color,
  progress,
  isSelf = false,
  finished = false,
  rank,
}: RallyCarProps) {
  const safeProgress = clampProgress(progress);
  const ratio = safeProgress / 100;

  return (
    <div
      className={`math-race-car${isSelf ? " is-self" : ""}${finished ? " is-finished" : ""}`}
      style={{ "--progress": ratio } as CSSProperties}
    >
      <div className="math-race-car-art">
        <span className="math-race-car-name">
          {typeof rank === "number" ? `${rank}. ` : ""}
          {playerName}
        </span>
        <svg
          className="math-race-car-svg"
          viewBox="0 0 72 38"
          role="img"
          aria-label={`${playerName} ralli avtomobili`}
        >
          <ellipse cx="37" cy="35" rx="31" ry="2.6" fill="rgba(0,0,0,.4)" />

          <rect x="11" y="1.5" width="13" height="7" rx="2.4" fill="#0b0f1a" />
          <rect x="11" y="29.5" width="13" height="7" rx="2.4" fill="#0b0f1a" />
          <rect x="47" y="1.5" width="13" height="7" rx="2.4" fill="#0b0f1a" />
          <rect x="47" y="29.5" width="13" height="7" rx="2.4" fill="#0b0f1a" />

          <path
            d="M9 10 Q7 10 7 13 L7 25 Q7 28 9 28 L56 28 Q64 27 68 19 Q64 11 56 10 Z"
            fill={color}
            stroke="rgba(0,0,0,.45)"
            strokeWidth="1"
          />

          <path d="M7 18 L64 18 L64 20 L7 20 Z" fill="rgba(255,255,255,.85)" />

          <path
            d="M9 10 Q7 10 7 13 L7 15.5 L56 15.5 Q63 15 66 19 L64 19 Q62 14 56 13 Z"
            fill="rgba(255,255,255,.28)"
          />

          <path d="M46 11 L55 12 Q60 13.5 62.5 19 Q60 24.5 55 25 L46 26 Z" fill="#0b1220" opacity="0.82" />
          <path d="M15 11 L24 11 L24 26 L15 26 Z" fill="#0b1220" opacity="0.6" />

          <rect x="3" y="8" width="6" height="22" rx="2.2" fill="#1f2937" />

          <rect x="65" y="13.5" width="4" height="3.4" rx="1.2" fill="#fde68a" />
          <rect x="65" y="21.1" width="4" height="3.4" rx="1.2" fill="#fde68a" />

          <circle cx="31" cy="19" r="6" fill="rgba(255,255,255,.92)" />
          <circle cx="31" cy="19" r="6" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.2" />
        </svg>
        {finished ? <span className="math-race-car-flag" aria-hidden="true">🏁</span> : null}
      </div>
    </div>
  );
}
