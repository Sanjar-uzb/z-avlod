"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gradeFiveToSixQuestions } from "./data/grade5-6";
import { gradeSevenToNineQuestions } from "./data/grade7-9";
import { answerMatches, getRandomQuestions } from "./lib/questionUtils";
import {
  calculateProgressGain,
  calculateScoreDelta,
  formatAccuracy,
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
import RaceHeader from "./components/RaceHeader";
import RallyTrack from "./components/RallyTrack";
import QuestionCard, { type QuestionFeedback } from "./components/QuestionCard";

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
  const [playerId] = useState<string>(() => {
    if (typeof window === "undefined") return createPlayerId();
    return window.localStorage.getItem(PLAYER_ID_KEY) || createPlayerId();
  });
  const [roomState, setRoomState] = useState<MathRaceRoom | null>(null);
  const [questions, setQuestions] = useState<MathQuestion[]>(() =>
    getRandomQuestions(POOLS["5-6"], QUESTION_COUNT, "5-6"),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Poyga uchun roomga qo'shiling.");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [finished, setFinished] = useState(false);
  const hasSavedResult = useRef(false);
  const questionStartedAt = useRef(0);

  const localPlayer = useMemo(
    () => roomState?.players.find((player) => player.id === playerId) ?? null,
    [playerId, roomState],
  );

  const connectedPlayers = useMemo(
    () => roomState?.players.filter((player) => player.connected) ?? [],
    [roomState],
  );

  const leaderboard = useMemo(
    () =>
      [...connectedPlayers].sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.score !== a.score) return b.score - a.score;
        return a.averageAnswerTime - b.averageAnswerTime;
      }),
    [connectedPlayers],
  );

  const currentQuestion = questions[questionIndex];

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
      setFeedback(null);
      setAwaitingNext(false);
      setStatusMessage(`${grade} sinf uchun room qo'shildi. Barcha o'yinchilar real vaqt rejimida ko'rsatiladi.`);
      setJoinedRoom(true);
      setFinished(false);
      hasSavedResult.current = false;
      questionStartedAt.current = typeof performance === "undefined" ? 0 : performance.now();
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

  const submitAnswer = useCallback(() => {
    if (!roomState || !localPlayer || !currentQuestion || finished || awaitingNext) return;

    const isCorrect = answerMatches(answer, currentQuestion.answer);
    const elapsedSeconds = Math.max(0, (performance.now() - questionStartedAt.current) / 1000);
    const delta = isCorrect
      ? calculateScoreDelta(true, currentQuestion.difficulty, elapsedSeconds, localPlayer.combo)
      : -20;
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
    setFeedback(
      isCorrect
        ? {
            status: "correct",
            text: `To'g'ri! +${Math.round(Math.abs(delta))} ball`,
            detail: `Avtomobil +${gainLabel(gainedProgress)} oldinga siljidi.`,
          }
        : {
            status: "wrong",
            text: `Noto'g'ri. To'g'ri javob: ${currentQuestion.answer}`,
            detail: currentQuestion.explanation,
          },
    );
    setAwaitingNext(true);
  }, [answer, awaitingNext, currentQuestion, finished, localPlayer, playerId, questionIndex, roomId, roomState]);

  const handleNext = useCallback(() => {
    if (!roomState || !localPlayer) return;

    if (questionIndex >= questions.length - 1) {
      finishGame(Math.round(localPlayer.score), localPlayer.correctAnswers, localPlayer.wrongAnswers);
      return;
    }

    setFeedback(null);
    setAwaitingNext(false);
    setAnswer("");
    setQuestionIndex((previous) => previous + 1);
    questionStartedAt.current = typeof performance === "undefined" ? 0 : performance.now();
  }, [finishGame, localPlayer, questionIndex, questions.length, roomState]);

  useEffect(() => {
    return () => {
      if (roomId) {
        leaveMathRaceRoom(roomId, playerId);
      }
    };
  }, [playerId, roomId]);

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
            <StatBox
              label="Aniqlik"
              value={formatAccuracy(
                localPlayer?.correctAnswers ?? 0,
                Math.max(1, (localPlayer?.correctAnswers ?? 0) + (localPlayer?.wrongAnswers ?? 0)),
              )}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => joinRace(selectedGrade)} style={primaryButtonStyle}>
              Qayta boshlash
            </button>
            <a href="/games" style={secondaryButtonStyle}>Boshqa o&apos;yinlar</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container math-race-page">
      <RaceHeader
        gradeGroup={selectedGrade}
        roomId={roomId}
        score={localPlayer?.score ?? 0}
        combo={localPlayer?.combo ?? 0}
        players={leaderboard.length}
      />

      <RallyTrack players={connectedPlayers} selfId={playerId} />

      <QuestionCard
        question={currentQuestion}
        index={questionIndex}
        total={questions.length}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmit={submitAnswer}
        onNext={handleNext}
        awaitingNext={awaitingNext}
        isLast={questionIndex >= questions.length - 1}
        disabled={!localPlayer}
        feedback={feedback}
        correct={localPlayer?.correctAnswers ?? 0}
        wrong={localPlayer?.wrongAnswers ?? 0}
        accuracy={formatAccuracy(
          localPlayer?.correctAnswers ?? 0,
          Math.max(1, (localPlayer?.correctAnswers ?? 0) + (localPlayer?.wrongAnswers ?? 0)),
        )}
      />

      <p className="math-race-status">{statusMessage}</p>
    </div>
  );
}

function gainLabel(progress: number): string {
  const rounded = Math.round(Math.max(0, progress));
  return `${rounded}%`;
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
