"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gradeFiveToSixQuestions } from "./data/grade5-6";
import { gradeSevenToNineQuestions } from "./data/grade7-9";
import {
  answerMatches,
  getRandomQuestions,
  getTimeLimitByDifficulty,
} from "./lib/questionUtils";
import {
  calculateProgressGain,
  calculateScoreDelta,
  formatAccuracy,
  formatProgress,
  formatScore,
  getAccuracy,
} from "./lib/scoreUtils";
import {
  generateRoomId,
  joinMathRaceRoom,
  leaveMathRaceRoom,
  subscribeToRoom,
  updateMathRaceRoom,
} from "./lib/multiplayer";
import type { GradeGroup, MathQuestion, MathRaceRoom, RacePlayer } from "./types";
import { saveGenericGameResult } from "@/lib/storage";

const QUESTION_COUNT = 20;
const PLAYER_NAME_KEY = "zavlod_math_player_name";
const PLAYER_ID_KEY = "zavlod_math_player_id";
const ROOM_ID_KEY = "zavlod_math_room_id";

const POOLS: Record<GradeGroup, MathQuestion[]> = {
  "5-6": gradeFiveToSixQuestions,
  "7-9": gradeSevenToNineQuestions,
};

function createPlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function MatematikaGame() {
  const [selectedGrade, setSelectedGrade] = useState<GradeGroup>("5-6");
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window === "undefined") return "Sanjar";
    return window.localStorage.getItem(PLAYER_NAME_KEY) || "Sanjar";
  });
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window === "undefined") return generateRoomId();
    return window.localStorage.getItem(ROOM_ID_KEY) || generateRoomId();
  });
  const [playerId, setPlayerId] = useState<string>(() => {
    if (typeof window === "undefined") return createPlayerId();
    return window.localStorage.getItem(PLAYER_ID_KEY) || createPlayerId();
  });
  const [roomState, setRoomState] = useState<MathRaceRoom | null>(null);
  const [questions, setQuestions] = useState<MathQuestion[]>(() =>
    getRandomQuestions(POOLS["5-6"], QUESTION_COUNT, "5-6"),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [statusMessage, setStatusMessage] = useState("Poyga uchun roomga qo'shiling.");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [finished, setFinished] = useState(false);
  const hasSavedResult = useRef(false);

  const localPlayer = useMemo(
    () => roomState?.players.find((player) => player.id === playerId) ?? null,
    [playerId, roomState],
  );

  const currentQuestion = questions[questionIndex];
  const leaderboard = useMemo(
    () =>
      [...(roomState?.players.filter((player) => player.connected) ?? [])].sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.score !== a.score) return b.score - a.score;
        return a.averageAnswerTime - b.averageAnswerTime;
      }),
    [roomState],
  );

  const joinRace = useCallback(
    (grade: GradeGroup) => {
      const nextRoomId = roomId.trim() || generateRoomId();
      const nextPool = getRandomQuestions(POOLS[grade], QUESTION_COUNT, grade);
      const result = joinMathRaceRoom({
        roomId: nextRoomId,
        gradeGroup: grade,
        playerName: playerName.trim() || "Sanjar",
        playerId,
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ROOM_ID_KEY, nextRoomId);
        window.localStorage.setItem(PLAYER_NAME_KEY, playerName.trim() || "Sanjar");
        window.localStorage.setItem(PLAYER_ID_KEY, playerId);
      }

      setSelectedGrade(grade);
      setRoomId(nextRoomId);
      setRoomState(result.room);
      setQuestions(nextPool);
      setQuestionIndex(0);
      setAnswer("");
      setTimeLeft(getTimeLimitByDifficulty(nextPool[0]?.difficulty ?? "easy"));
      setStatusMessage(`${grade} sinf uchun room qo'shildi. Barcha o'yinchilar real vaqt rejimida ko'rsatiladi.`);
      setJoinedRoom(true);
      setFinished(false);
      hasSavedResult.current = false;
    },
    [playerId, playerName, roomId],
  );

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (nextRoom) => {
      if (!nextRoom) return;
      setRoomState(nextRoom);
    });

    return () => unsubscribe();
  }, [roomId]);

  const finishGame = useCallback(
    (finalScore: number, finalCorrect: number, finalWrong: number) => {
      if (!roomState || hasSavedResult.current) return;
      hasSavedResult.current = true;

      const accuracy = getAccuracy(finalCorrect, finalCorrect + finalWrong);
      saveGenericGameResult({
        title: "Matematika Poygasi",
        gameType: "matematika",
        score: finalScore,
        totalScore: QUESTION_COUNT * 150,
        completed: true,
        summary: {
          grade: selectedGrade,
          correctAnswers: finalCorrect,
          wrongAnswers: finalWrong,
          accuracy,
          totalQuestions: questions.length,
          status: "finished",
        },
        details: {
          grade: selectedGrade,
          questionCount: questions.length,
          accuracy,
          totalAttempts: finalCorrect + finalWrong,
        },
      });

      const finishedRoom: MathRaceRoom = {
        ...roomState,
        status: "finished",
        finishedAt: Date.now(),
        players: roomState.players.map((player) =>
          player.id === playerId
            ? { ...player, finished: true, score: Math.round(player.score), progress: Math.min(100, player.progress) }
            : player,
        ),
      };

      setRoomState(finishedRoom);
      updateMathRaceRoom(roomId, finishedRoom);
      setStatusMessage("Poyga tugadi! Natijangiz saqlandi.");
      setFinished(true);
    },
    [playerId, questions.length, roomId, roomState, selectedGrade],
  );

  const submitAnswer = useCallback(
    (manualTimeout = false) => {
      if (!roomState || !localPlayer || !currentQuestion || finished) return;

      const isCorrect = manualTimeout ? false : answerMatches(answer, currentQuestion.answer);
      const elapsedSeconds = Math.max(0, getTimeLimitByDifficulty(currentQuestion.difficulty) - timeLeft);
      const delta = isCorrect ? calculateScoreDelta(true, currentQuestion.difficulty, elapsedSeconds, localPlayer.combo) : -20;
      const nextScore = Math.max(0, Math.round(localPlayer.score + delta));
      const gainedProgress = isCorrect ? calculateProgressGain(currentQuestion.difficulty, elapsedSeconds) : 0;
      const nextProgress = Math.min(100, localPlayer.progress + gainedProgress);
      const nextCorrect = isCorrect ? localPlayer.correctAnswers + 1 : localPlayer.correctAnswers;
      const nextWrong = isCorrect ? localPlayer.wrongAnswers : localPlayer.wrongAnswers + 1;
      const nextCombo = isCorrect ? localPlayer.combo + 1 : 0;
      const nextPlayer: RacePlayer = {
        ...localPlayer,
        progress: Math.round(nextProgress),
        score: nextScore,
        correctAnswers: nextCorrect,
        wrongAnswers: nextWrong,
        combo: nextCombo,
        maxCombo: Math.max(localPlayer.maxCombo, nextCombo),
        currentQuestion: questionIndex + 1,
        totalAnswerTime: localPlayer.totalAnswerTime + elapsedSeconds,
        averageAnswerTime: Math.round((localPlayer.totalAnswerTime + elapsedSeconds) / Math.max(1, nextCorrect + nextWrong)),
        finished: nextProgress >= 100,
        connected: true,
      };

      const nextRoom: MathRaceRoom = {
        ...roomState,
        status: "racing",
        players: roomState.players.map((player) => (player.id === playerId ? nextPlayer : player)),
      };

      setRoomState(nextRoom);
      updateMathRaceRoom(roomId, nextRoom);
      setStatusMessage(
        isCorrect
          ? `To'g'ri! +${Math.round(Math.abs(delta))} ball.`
          : manualTimeout
            ? `Vaqt tugadi. To'g'ri javob: ${currentQuestion.answer}`
            : `Noto'g'ri javob. To'g'ri javob: ${currentQuestion.answer}`,
      );

      if (questionIndex >= questions.length - 1) {
        setQuestionIndex(questions.length);
        setTimeout(() => finishGame(nextScore, nextCorrect, nextWrong), 150);
        return;
      }

      setAnswer("");
      setQuestionIndex((prev) => prev + 1);
      setTimeLeft(
        getTimeLimitByDifficulty(questions[questionIndex + 1]?.difficulty ?? currentQuestion.difficulty),
      );
    },
    [answer, currentQuestion, finished, localPlayer, playerId, questionIndex, questions, roomId, roomState, timeLeft],
  );

  useEffect(() => {
    if (!joinedRoom || finished || !currentQuestion) return;

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.setTimeout(() => submitAnswer(true), 0);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentQuestion, finished, joinedRoom, submitAnswer]);

  useEffect(() => {
    return () => {
      if (roomId) {
        leaveMathRaceRoom(roomId, playerId);
      }
    };
  }, [playerId, roomId]);

  const activeQuestionNumber = Math.min(questionIndex + 1, questions.length);

  if (!joinedRoom) {
    return (
      <div className="container" style={{ padding: "32px 16px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 24,
              padding: 28,
            }}
          >
            <p style={{ textTransform: "uppercase", letterSpacing: 2, color: "#7dd3fc", margin: 0 }}>
              Matematika Poygasi
            </p>
            <h1 style={{ margin: "10px 0 12px", fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
              Real multiplayer matematik poyga
            </h1>
            <p style={{ color: "#dbeafe", margin: "0 0 18px" }}>
              Bir xil room ID ni ishlatgan boshqa foydalanuvchilar bilan real vaqt rejimida birga poyga o‘tkazing.
            </p>

            <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#dbeafe" }}>Foydalanuvchi ismi</span>
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Sanjar"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ color: "#dbeafe" }}>Room ID</span>
                <input
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                  placeholder="MATH-ABC123"
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {(["5-6", "7-9"] as GradeGroup[]).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => joinRace(grade)}
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(125,211,252,0.7)",
                    borderRadius: 18,
                    padding: 22,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#bae6fd", marginBottom: 8 }}>Sinf</div>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>{grade}</div>
                  <div style={{ marginTop: 8, color: "#dbeafe" }}>
                    {grade === "5-6" ? "Asosiy arifmetika va mantiq" : "Algebra va geometriya"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const finalAccuracy = getAccuracy(
      localPlayer?.correctAnswers ?? 0,
      Math.max(1, (localPlayer?.correctAnswers ?? 0) + (localPlayer?.wrongAnswers ?? 0)),
    );

    return (
      <div className="container" style={{ padding: "32px 16px 60px" }}>
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "rgba(15,23,42,0.8)",
            borderRadius: 24,
            border: "1px solid rgba(148,163,184,0.35)",
            padding: 28,
          }}
        >
          <p style={{ color: "#a5f3fc", marginTop: 0 }}>Natija</p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", margin: "0 0 14px" }}>Poyga yakunlandi</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
            <StatBox label="Ball" value={formatScore(localPlayer?.score ?? 0)} />
            <StatBox label="To'g'ri" value={String(localPlayer?.correctAnswers ?? 0)} />
            <StatBox label="Noto'g'ri" value={String(localPlayer?.wrongAnswers ?? 0)} />
            <StatBox label="Aniqlik" value={formatAccuracy(localPlayer?.correctAnswers ?? 0, Math.max(1, (localPlayer?.correctAnswers ?? 0) + (localPlayer?.wrongAnswers ?? 0)))} />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => joinRace(selectedGrade)} style={primaryButtonStyle}>
              Qayta boshlash
            </button>
            <a href="/games" style={secondaryButtonStyle}>Boshqa o'yinlar</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#a5f3fc", textTransform: "uppercase", letterSpacing: 2, fontSize: 12 }}>
              Matematika Poygasi
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>Sinf {selectedGrade}</h1>
            <p style={{ color: "#cbd5e1", margin: "8px 0 0" }}>Room: {roomId}</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Pill label="Ball" value={formatScore(localPlayer?.score ?? 0)} />
            <Pill label="Combo" value={String(localPlayer?.combo ?? 0)} />
            <Pill label="Vaqt" value={`${timeLeft}s`} />
            <Pill label="Players" value={String(leaderboard.length)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.65fr", gap: 20 }}>
          <div
            style={{
              background: "rgba(15,23,42,0.82)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 22,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#cbd5e1", fontSize: 14 }}>
                <span>
                  Savol {activeQuestionNumber}/{questions.length}
                </span>
                <span>{currentQuestion?.difficulty.toUpperCase()}</span>
              </div>
              <div style={{ height: 10, background: "rgba(148,163,184,0.2)", borderRadius: 999 }}>
                <div
                  style={{
                    width: `${(activeQuestionNumber / questions.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #22d3ee, #8b5cf6)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: "rgba(15,118,110,0.14)",
                border: "1px solid rgba(94,234,212,0.35)",
                borderRadius: 18,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: 1.5 }}>
                Mavzu: {currentQuestion?.category}
              </p>
              <h2 style={{ margin: "12px 0 0", fontSize: "clamp(1.7rem, 3vw, 2.5rem)", lineHeight: 1.3 }}>
                {currentQuestion?.question}
              </h2>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitAnswer(false);
                  }
                }}
                placeholder="Javobni yozing"
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(148,163,184,0.4)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  color: "#f8fafc",
                  fontSize: 18,
                }}
              />
              <button type="button" onClick={() => submitAnswer(false)} style={primaryButtonStyle}>
                Javob berish
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#dbeafe" }}>
              <div
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(96,165,250,0.35)",
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                To'g'ri: {localPlayer?.correctAnswers ?? 0}
              </div>
              <div
                style={{
                  background: "rgba(239,68,68,0.14)",
                  border: "1px solid rgba(248,113,113,0.35)",
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                Noto'g'ri: {localPlayer?.wrongAnswers ?? 0}
              </div>
              <div
                style={{
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(74,222,128,0.35)",
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                Aniqlik: {formatAccuracy(localPlayer?.correctAnswers ?? 0, Math.max(1, (localPlayer?.correctAnswers ?? 0) + (localPlayer?.wrongAnswers ?? 0)))}
              </div>
            </div>

            <p style={{ margin: "18px 0 0", color: "#dbeafe" }}>{statusMessage}</p>
          </div>

          <div
            style={{
              background: "rgba(15,23,42,0.82)",
              border: "1px solid rgba(148,163,184,0.3)",
              borderRadius: 22,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>Poyga jadvali</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    background:
                      player.id === playerId
                        ? "rgba(59,130,246,0.18)"
                        : "rgba(148,163,184,0.08)",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, color: "#f8fafc" }}>{index + 1}.</span>
                    <span style={{ fontSize: 20 }}>{player.carId}</span>
                    <span style={{ color: "#f8fafc" }}>{player.name}</span>
                  </div>
                  <div style={{ textAlign: "right", color: "#dbeafe" }}>
                    <div>{formatProgress(player.progress)}</div>
                    <small>{formatScore(player.score)} ball</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.82)",
        border: "1px solid rgba(148,163,184,0.3)",
        borderRadius: 999,
        padding: "10px 14px",
        minWidth: 80,
      }}
    >
      <div style={{ fontSize: 11, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</div>
      <strong style={{ fontSize: 20 }}>{value}</strong>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.72)",
        border: "1px solid rgba(148,163,184,0.25)",
        borderRadius: 16,
        padding: "14px 18px",
      }}
    >
      <div style={{ color: "#cbd5e1", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.1 }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(148,163,184,0.4)",
  borderRadius: 12,
  padding: "14px 16px",
  color: "#f8fafc",
  fontSize: 18,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(15,23,42,0.75)",
  border: "1px solid rgba(148,163,184,0.4)",
  borderRadius: 12,
  padding: "12px 18px",
  color: "#e2e8f0",
  textDecoration: "none",
};
