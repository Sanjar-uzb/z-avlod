"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CrosswordEntry {
  num: number;
  direction: "across" | "down";
  row: number;
  col: number;
  answer: string;
  clue: string;
}

interface CrosswordPuzzle {
  title: string;
  width: number;
  height: number;
  entries: CrosswordEntry[];
}

// Word banks per fan; generator will place words with intersections.
const WORD_BANKS: Record<string, { answer: string; clue: string }[]> = {
  fizika: [
    { answer: "FORCE", clue: "Harakatga sabab bo‘luvchi kuch" },
    { answer: "MASS", clue: "Jismda modda miqdori" },
    { answer: "ENERGY", clue: "Ish bajarish qobiliyati" },
    { answer: "SPEED", clue: "Harakat tezligi" },
    { answer: "LIGHT", clue: "Ko‘rishga yordam beruvchi nuri" },
    { answer: "ATOM", clue: "Eng kichik modda bo‘lagi" },
    { answer: "WAVE", clue: "To‘lqinli uzatiladigan energiya" },
    { answer: "HEAT", clue: "Issiqlik energiyasi" },
    { answer: "WORK", clue: "Kuch va masofa ko‘paytmasi" },
    { answer: "GRAVITY", clue: "Yerni tortish kuchi" },
  ],
  kimyo: [
    { answer: "ATOM", clue: "Kimyoviy elementning eng kichik qismi" },
    { answer: "ACID", clue: "Kislotalar guruhiga mansub modda" },
    { answer: "MOLE", clue: "Modda miqdorini aniqlash birligi" },
    { answer: "SALT", clue: "Tuz va kislota reaksiyasi natijasi" },
    { answer: "REACT", clue: "Kimyoviy o‘zaro ta’sir" },
    { answer: "BOND", clue: "Atomlarni bog‘lab turuvchi kuch" },
    { answer: "BASE", clue: "Ishqoriy modda" },
    { answer: "ENERGY", clue: "Reaksiyada berilgan yoki olingan kuch" },
    { answer: "SOLID", clue: "Qattiq holatdagi modda" },
    { answer: "ION", clue: "Elektronlar yo‘qotgan yoki olgan atom" },
  ],
  biologiya: [
    { answer: "CELL", clue: "Hayotning eng kichik birliklari" },
    { answer: "OXYGEN", clue: "Havo tarkibidagi hayot uchun muhim gaz" },
    { answer: "DNA", clue: "Genetik ma’lumotni saqlovchi zanjir" },
    { answer: "FOOD", clue: "O‘simlik va hayvonlar uchun oziq" },
    { answer: "GENES", clue: "Irslik xususiyatlarni belgilovchi bo‘lim" },
    { answer: "PLANT", clue: "O‘sadigan yashil organizm" },
    { answer: "ANIMAL", clue: "Tirik jonivor" },
    { answer: "ECOSYS", clue: "O‘simlik va hayvonlar tizimi" },
    { answer: "HABITAT", clue: "Organizm yashaydigan muhit" },
    { answer: "BACTERIA", clue: "Mayda mikroskopik organizmlar" },
  ],
  informatika: [
    { answer: "CODE", clue: "Programmani yozish usuli" },
    { answer: "BINARY", clue: "0 va 1 dan tashkil topgan raqam sistemas" },
    { answer: "LOOP", clue: "Takrorlanuvchi kod bloki" },
    { answer: "MEMORY", clue: "Ma’lumotlar saqlanadigan joy" },
    { answer: "ARRAY", clue: "Elementlar ketma-ketligi" },
    { answer: "NETWORK", clue: "Tarmoqlar orqali ulangan kompyuterlar" },
    { answer: "BUG", clue: "Noto‘g‘ri dasturlash xatosi" },
    { answer: "LOGIC", clue: "Hisoblash va qaror qabul qilish asoslari" },
    { answer: "SCRIPT", clue: "Skript tilida yozilgan kod" },
    { answer: "DATA", clue: "Ma’lumotlar ombori" },
  ],
};

function generatePuzzle(title: string, words: { answer: string; clue: string }[], width = 12, height = 12): CrosswordPuzzle {
  // simple greedy placement: place first word across centered, then try to intersect others
  const grid: (string | null)[][] = Array.from({ length: height + 1 }, () => Array.from({ length: width + 1 }, () => null));
  const entries: CrosswordEntry[] = [];
  let num = 1;

  function placeWordAt(answer: string, clue: string, row: number, col: number, direction: "across" | "down") {
    // place letters
    for (let i = 0; i < answer.length; i++) {
      const r = row + (direction === "down" ? i : 0);
      const c = col + (direction === "across" ? i : 0);
      grid[r][c] = answer[i];
    }
    entries.push({ num: num++, direction, row, col, answer, clue });
    return true;
  }

  function canPlace(answer: string, row: number, col: number, direction: "across" | "down") {
    for (let i = 0; i < answer.length; i++) {
      const r = row + (direction === "down" ? i : 0);
      const c = col + (direction === "across" ? i : 0);
      if (r < 1 || c < 1 || r > height || c > width) return false;
      const existing = grid[r][c];
      if (existing && existing !== answer[i]) return false;
    }
    return true;
  }

  // place first word across centered
  if (words.length === 0) return { title, width, height, entries };
  const first = words[0].answer.toUpperCase();
  const startRow = Math.floor(height / 2);
  const startCol = Math.max(1, Math.floor((width - first.length) / 2) + 1);
  placeWordAt(first, words[0].clue, startRow, startCol, "across");

  // for each next word, try to find intersection with placed letters
  for (let w = 1; w < words.length; w++) {
    const answer = words[w].answer.toUpperCase();
    let placed = false;

    // try to intersect with any existing letter
    for (let r = 1; r <= height && !placed; r++) {
      for (let c = 1; c <= width && !placed; c++) {
        const ch = grid[r][c];
        if (!ch) continue;
        // find positions in answer matching ch
        for (let i = 0; i < answer.length && !placed; i++) {
          if (answer[i] !== ch) continue;
          // attempt place perpendicular
          // if existing letter is part of an across word, place this word down and vice versa
          // we don't track orientations per cell, so try both
          const tryRowDown = r - i;
          const tryColDown = c;
          if (canPlace(answer, tryRowDown, tryColDown, "down")) {
            placeWordAt(answer, words[w].clue, tryRowDown, tryColDown, "down");
            placed = true;
            break;
          }

          const tryRowAcross = r;
          const tryColAcross = c - i;
          if (canPlace(answer, tryRowAcross, tryColAcross, "across")) {
            placeWordAt(answer, words[w].clue, tryRowAcross, tryColAcross, "across");
            placed = true;
            break;
          }
        }
      }
    }

    // fallback: scan for any place across then down
    if (!placed) {
      for (let r = 1; r <= height && !placed; r++) {
        for (let c = 1; c <= width && !placed; c++) {
          if (canPlace(answer, r, c, "across")) {
            placeWordAt(answer, words[w].clue, r, c, "across");
            placed = true;
            break;
          }
          if (canPlace(answer, r, c, "down")) {
            placeWordAt(answer, words[w].clue, r, c, "down");
            placed = true;
            break;
          }
        }
      }
    }
    // if still not placed, skip (rare)
  }

  return { title, width, height, entries };
}

const FAN_LABELS: Record<string, string> = {
  fizika: "Fizika",
  kimyo: "Kimyo",
  biologiya: "Biologiya",
  informatika: "Informatika",
};

export default function ClientCrossword() {
  const searchParams = useSearchParams();
  const fan = searchParams.get("fan") || "";
  const [selectedFan, setSelectedFan] = useState<string>(fan);
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setSelectedFan(fan);
  }, [fan]);

  useEffect(() => {
    setLetters({});
    setScore(0);
    setFinished(false);
  }, [selectedFan]);

  // Generate a puzzle (with intersections) from the word bank for the selected fan.
  const puzzle = useMemo(() => {
    const words = WORD_BANKS[selectedFan];
    if (!words) return undefined;
    return generatePuzzle(FAN_LABELS[selectedFan] || selectedFan, words, 12, 12);
  }, [selectedFan]);

  // Create grid with intersections: for simplicity we honor the configured row/col
  // but ensure overlapping letters match; if conflicts detected, fall back to non-overlap.
  const { letterCells, startNumbers, width, height } = useMemo(() => {
    const w = puzzle?.width || 12;
    const h = puzzle?.height || 10;
    const cells: Record<string, string> = {};
    const numbers: Record<string, number> = {};
    const entries = puzzle?.entries || [];

    // First pass: place across entries, then down entries, but allow intersections.
    entries
      .filter((e) => e.direction === "across")
      .forEach((entry) => {
        for (let i = 0; i < entry.answer.length; i++) {
          const r = entry.row;
          const c = entry.col + i;
          const key = `${r}-${c}`;
          cells[key] = entry.answer[i];
        }
        numbers[`${entry.row}-${entry.col}`] = entry.num;
      });

    entries
      .filter((e) => e.direction === "down")
      .forEach((entry) => {
        for (let i = 0; i < entry.answer.length; i++) {
          const r = entry.row + i;
          const c = entry.col;
          const key = `${r}-${c}`;
          const ch = entry.answer[i];
          if (cells[key] && cells[key] !== ch) {
            // Conflict: create a fallback by placing this down entry shifted right until it fits.
            let placed = false;
            for (let shift = 1; shift <= 3 && !placed; shift++) {
              let conflict = false;
              for (let j = 0; j < entry.answer.length; j++) {
                const rr = entry.row + j;
                const cc = entry.col + shift;
                const k2 = `${rr}-${cc}`;
                if (cells[k2] && cells[k2] !== entry.answer[j]) {
                  conflict = true;
                  break;
                }
              }
              if (!conflict) {
                for (let j = 0; j < entry.answer.length; j++) {
                  const rr = entry.row + j;
                  const cc = entry.col + shift;
                  cells[`${rr}-${cc}`] = entry.answer[j];
                }
                numbers[`${entry.row}-${entry.col + shift}`] = entry.num;
                placed = true;
              }
            }
            if (!placed) {
              // As a last resort, place letters in separate rows far below to avoid conflicts.
              const baseRow = h + 2 + entry.num;
              for (let j = 0; j < entry.answer.length; j++) {
                cells[`${baseRow + j}-${entry.col}`] = entry.answer[j];
              }
              numbers[`${baseRow}-${entry.col}`] = entry.num;
            }
          } else {
            cells[key] = ch;
          }
        }
        if (!numbers[`${entry.row}-${entry.col}`]) numbers[`${entry.row}-${entry.col}`] = entry.num;
      });

    return { letterCells: cells, startNumbers: numbers, width: w, height: h };
  }, [puzzle]);

  function updateCell(row: number, col: number, value: string) {
    const key = `${row}-${col}`;
    setLetters((prev) => ({ ...prev, [key]: value.toUpperCase().slice(0, 1) }));
  }

  function getAnswerText(entry: CrosswordEntry) {
    let text = "";
    for (let index = 0; index < entry.answer.length; index++) {
      const row = entry.row + (entry.direction === "down" ? index : 0);
      const col = entry.col + (entry.direction === "across" ? index : 0);
      text += letters[`${row}-${col}`] || "";
    }
    return text;
  }

  function checkAnswers() {
    if (!puzzle) return;
    let correct = 0;
    puzzle.entries.forEach((entry) => {
      if (getAnswerText(entry) === entry.answer) correct++;
    });
    setScore(correct);
    setFinished(true);
  }

  function reset() {
    setLetters({});
    setScore(0);
    setFinished(false);
  }

  return (
    <div>
      {!selectedFan || !puzzle ? (
        <div className="container">
          <section className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <h1>AI Krossvord</h1>
                <p>Fan tanlang va 10 ta savoldan iborat krossvordni yeching.</p>
              </div>
              <Link className="btn btnGhost" href="/games/ai-krosvord">
                Orqaga
              </Link>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 18, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {Object.entries(FAN_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/games/ai-krosvord/play?fan=${key}`}
                  className="card"
                  style={{ textDecoration: "none", color: "inherit", padding: 18, minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                >
                  <div>
                    <div className="h2" style={{ marginBottom: 8 }}>{label}</div>
                    <div className="muted">Fan bo‘yicha krossvordli savollar.</div>
                  </div>
                  <span className="badge">Boshlash</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="container">
          <section className="card">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div>
                <h1>AI Krossvord: {puzzle.title}</h1>
                <p>Fan asosida tuzilgan krossvordni yeching. Har bir fan uchun 10 ta savol mavjud.</p>
              </div>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <Link className="btn btnGhost" href="/games/ai-krosvord">
                  Fan tanlash
                </Link>
                <button className="btn" onClick={reset} type="button">
                  Yangi boshlash
                </button>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 20 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${puzzle.width}, minmax(32px, 1fr))`,
                  gap: 4,
                }}
              >
                {Array.from({ length: puzzle.height }, (_, rowIndex) => {
                  const row = rowIndex + 1;
                  return Array.from({ length: puzzle.width }, (_, colIndex) => {
                    const col = colIndex + 1;
                    const key = `${row}-${col}`;
                    const letter = letterCells[key];
                    if (!letter) {
                      return (
                        <div key={key} style={{ width: "100%", paddingTop: "100%", background: "#061221", borderRadius: 4 }} />
                      );
                    }

                    const cellNumber = startNumbers[key];
                    const value = letters[key] || "";
                    const actualLetter = letter;

                    return (
                      <div
                        key={key}
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 4,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {cellNumber ? (
                          <div style={{ position: "absolute", top: 4, left: 4, fontSize: 10, color: "#dbeafe" }}>
                            {cellNumber}
                          </div>
                        ) : null}
                        <input
                          value={value}
                          maxLength={1}
                          onChange={(e) => updateCell(row, col, e.target.value.replace(/[^A-Za-z]/g, ""))}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: "none",
                            textAlign: "center",
                            fontSize: 18,
                            fontWeight: 700,
                            background: "transparent",
                            color: finished ? (value === actualLetter ? "#22c55e" : "#f87171") : "#f8fafc",
                            textTransform: "uppercase",
                            outline: "none",
                          }}
                          disabled={finished}
                        />
                        {finished && !value ? (
                          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.3)", fontSize: 18 }}>
                            {actualLetter}
                          </div>
                        ) : null}
                      </div>
                    );
                  });
                })}
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <h3>Bo'y (Across)</h3>
                  {puzzle.entries
                    .filter((entry) => entry.direction === "across")
                    .map((entry) => (
                      <p key={`${entry.num}-across`} style={{ marginBottom: 12 }}>
                        <strong>{entry.num}. </strong>
                        {entry.clue} ({entry.answer.length} harf)
                      </p>
                    ))}
                </div>

                <div>
                  <h3>Tik (Down)</h3>
                  {puzzle.entries
                    .filter((entry) => entry.direction === "down")
                    .map((entry) => (
                      <p key={`${entry.num}-down`} style={{ marginBottom: 12 }}>
                        <strong>{entry.num}. </strong>
                        {entry.clue} ({entry.answer.length} harf)
                      </p>
                    ))}
                </div>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <button className="btn" onClick={checkAnswers} type="button">
                  ✓ Javoblarni tekshirish
                </button>
                {finished ? (
                  <div style={{ color: "#dbeafe", minWidth: 120 }}>
                    To‘g‘ri: {score} / {puzzle.entries.length}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
