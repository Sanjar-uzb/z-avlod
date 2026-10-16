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
  HEARTBEAT_MS,
  STALE_CLEAN_MS,
  createPlayerId,
  createSelfPlayer,
  debugLog,
  isPlayerActive,
  mergeRoster,
  normalizeRoomId,
  shouldDropPlayer,
} from "./lib/mathRaceLogic";
import {
  cleanupStalePlayers,
  generateRoomId,
  joinRaceRoom,
  markPlayerLeft,
  pushPlayerState,
  subscribeRaceRoom,
  type JoinErrorCode,
} from "./lib/mathRaceRealtime";
import type { GradeGroup, MathQuestion, RacePlayer } from "./types";
import { saveGenericGameResult } from "@/lib/storage";
import RaceHeader from "./components/RaceHeader";
import RallyTrack from "./components/RallyTrack";
import QuestionCard, { type QuestionFeedback } from "./components/QuestionCard";

const QUESTION_COUNT = 20;
const PLAYER_NAME_KEY = "zavlod_math_player_name";
const PLAYER_ID_KEY = "zavlod_math_player_id";
const ROOM_ID_KEY = "zavlod_math_room_id";
const NOW_TICK_MS = 10_000;

const POOLS: Record<GradeGroup, MathQuestion[]> = {
  "5-6": gradeFiveToSixQuestions,
  "7-9": gradeSevenToNineQuestions,
};

type ConnectionState = "idle" | "connecting" | "connected" | "unavailable";

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
    const existing = window.localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const created = createPlayerId();
    window.localStorage.setItem(PLAYER_ID_KEY, created);
    return created;
  });
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [joinError, setJoinError] = useState<{ code: JoinErrorCode; message: string } | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
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
  const sessionRef = useRef({ roomId, playerId, localOnly });
  const joinedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = { roomId, playerId, localOnly };
  }, [roomId, playerId, localOnly]);

  useEffect(() => {
    joinedRef.current = joinedRoom;
  }, [joinedRoom]);

  const localPlayer = useMemo(
    () => players.find((player) => player.id === playerId) ?? null,
    [players, playerId],
  );

  const activePlayers = useMemo(
    () => players.filter((player) => isPlayerActive(player, nowMs)),
    [nowMs, players],
  );

  const trackPlayers = useMemo(
    () => players.filter((player) => !shouldDropPlayer(player, nowMs)),
    [nowMs, players],
  );

  const leaderboard = useMemo(
    () =>
      [...activePlayers].sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.score !== a.score) return b.score - a.score;
        return a.averageAnswerTime - b.averageAnswerTime;
      }),
    [activePlayers],
  );

  const currentQuestion = questions[questionIndex];

  const joinRace = useCallback(
    async (grade: GradeGroup) => {
      const nextRoomId = normalizeRoomId(roomId) || generateRoomId();
      const nextName = playerName.trim() || "Sanjar";
      const nextPool = getRandomQuestions(POOLS[grade], QUESTION_COUNT, grade);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ROOM_ID_KEY, nextRoomId);
        window.localStorage.setItem(PLAYER_NAME_KEY, nextName);
        window.localStorage.setItem(PLAYER_ID_KEY, playerId);
      }

      setJoinError(null);
      setRoomId(nextRoomId);
      setPlayerName(nextName);
      setSelectedGrade(grade);
      setQuestions(nextPool);
      setQuestionIndex(0);
      setAnswer("");
      setFeedback(null);
      setAwaitingNext(false);
      setFinished(false);
      setPlayers([createSelfPlayer({ playerId, name: nextName, roomId: nextRoomId, gradeGroup: grade })]);
      hasSavedResult.current = false;
      questionStartedAt.current = typeof performance === "undefined" ? 0 : performance.now();

      if (localOnly) {
        setConnectionState("idle");
        setStatusMessage("Lokal rejim: multiplayer ishlamayapti, faqat siz ko'ryapsiz.");
        setJoinedRoom(true);
        return;
      }

      setConnectionState("connecting");
      setStatusMessage("Roomga ulanilmoqda...");

      const result = await joinRaceRoom({
        roomId: nextRoomId,
        gradeGroup: grade,
        playerId,
        playerName: nextName,
      });

      if (!result.ok) {
        setConnectionState("unavailable");
        setJoinError({ code: result.code, message: result.message });
        setStatusMessage(result.message);
        setJoinedRoom(false);
        return;
      }

      setRoomId(result.roomId);
      setConnectionState("connected");
      setJoinedRoom(true);
      setStatusMessage(`${result.roomId} room qo'shildi. Barcha o'yinchilar real vaqt rejimida ko'rsatiladi.`);
    },
    [localOnly, playerId, playerName, roomId],
  );

  useEffect(() => {
    if (!joinedRoom || localOnly || !roomId || connectionState !== "connected") return;

    let cancelled = false;
    const unsubscribe = subscribeRaceRoom(roomId, {
      onPlayers: (serverPlayers) => {
        if (cancelled) return;
        setPlayers((previous) => mergeRoster(serverPlayers, previous, playerId));
      },
      onError: () => {
        if (cancelled) return;
        setConnectionState("unavailable");
        setStatusMessage("Realtime server bilan aloqa uzildi. O'yin lokal davom etadi.");
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [connectionState, joinedRoom, localOnly, playerId, roomId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!joinedRoom || localOnly || connectionState !== "connected" || !roomId) return;

    const timer = window.setInterval(() => {
      pushPlayerState(roomId, playerId, { lastSeenAtMs: Date.now() }).catch(() => {
        debugLog("PLAYER", "Heartbeat failed");
      });
    }, HEARTBEAT_MS);

    return () => window.clearInterval(timer);
  }, [connectionState, joinedRoom, localOnly, playerId, roomId]);

  useEffect(() => {
    if (!joinedRoom || localOnly || !roomId) return;

    const timer = window.setInterval(() => {
      cleanupStalePlayers(roomId).catch(() => {
        debugLog("ROOM", "Stale cleanup failed");
      });
    }, STALE_CLEAN_MS);

    return () => window.clearInterval(timer);
  }, [joinedRoom, localOnly, roomId]);

  useEffect(() => {
    const handler = () => {
      const { roomId: currentRoom, playerId: currentPlayer, localOnly: isLocal } = sessionRef.current;
      if (isLocal || !joinedRef.current || !currentRoom) return;
      markPlayerLeft(currentRoom, currentPlayer).catch(() => {});
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      handler();
    };
  }, []);

  const finishGame = useCallback(
    (finalScore: number, finalCorrect: number, finalWrong: number) => {
      const local = localPlayer;
      if (!local || hasSavedResult.current) return;
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

      const finishedPatch: Partial<RacePlayer> = {
        finished: true,
        score: Math.round(finalScore),
        progress: Math.min(100, local.progress),
        lastSeenAtMs: Date.now(),
      };

      setPlayers((previous) =>
        previous.map((player) => (player.id === playerId ? { ...player, ...finishedPatch } : player)),
      );

      if (connectionState === "connected" && !localOnly) {
        pushPlayerState(roomId, playerId, finishedPatch).catch(() => {
          debugLog("PLAYER", "Finish state sync failed");
        });
      }

      setStatusMessage("Poyga tugadi! Natijangiz saqlandi.");
      setFinished(true);
    },
    [connectionState, localOnly, playerId, questions.length, roomId, localPlayer, selectedGrade],
  );

  const submitAnswer = useCallback(() => {
    const local = localPlayer;
    if (!local || !currentQuestion || finished || awaitingNext) return;

    const isCorrect = answerMatches(answer, currentQuestion.answer);
    const elapsedSeconds = Math.max(0, (performance.now() - questionStartedAt.current) / 1000);
    const delta = isCorrect
      ? calculateScoreDelta(true, currentQuestion.difficulty, elapsedSeconds, local.combo)
      : -20;
    const nextScore = Math.max(0, Math.round(local.score + delta));
    const gainedProgress = isCorrect ? calculateProgressGain(currentQuestion.difficulty, elapsedSeconds) : 0;
    const nextProgress = Math.min(100, local.progress + gainedProgress);
    const nextCorrect = isCorrect ? local.correctAnswers + 1 : local.correctAnswers;
    const nextWrong = isCorrect ? local.wrongAnswers : local.wrongAnswers + 1;
    const nextCombo = isCorrect ? local.combo + 1 : 0;
    const nextPlayer: RacePlayer = {
      ...local,
      progress: Math.round(nextProgress),
      score: nextScore,
      correctAnswers: nextCorrect,
      wrongAnswers: nextWrong,
      combo: nextCombo,
      maxCombo: Math.max(local.maxCombo, nextCombo),
      currentQuestion: questionIndex + 1,
      totalAnswerTime: local.totalAnswerTime + elapsedSeconds,
      averageAnswerTime: Math.round(
        (local.totalAnswerTime + elapsedSeconds) / Math.max(1, nextCorrect + nextWrong),
      ),
      finished: nextProgress >= 100,
      connected: true,
      lastSeenAtMs: Date.now(),
    };

    setPlayers((previous) => previous.map((player) => (player.id === playerId ? nextPlayer : player)));
    debugLog("RACE", `Progress update: ${nextPlayer.name} -> ${nextPlayer.progress}%`);

    if (connectionState === "connected" && !localOnly) {
      pushPlayerState(roomId, playerId, nextPlayer).catch(() => {
        setStatusMessage("Serverga yuborib bo'lmadi. Internetni tekshirib qayta urinib ko'ring.");
      });
    }

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
  }, [
    answer,
    awaitingNext,
    connectionState,
    currentQuestion,
    finished,
    localOnly,
    localPlayer,
    playerId,
    questionIndex,
    roomId,
  ]);

  const handleNext = useCallback(() => {
    const local = localPlayer;
    if (!local) return;

    if (questionIndex >= questions.length - 1) {
      finishGame(Math.round(local.score), local.correctAnswers, local.wrongAnswers);
      return;
    }

    setFeedback(null);
    setAwaitingNext(false);
    setAnswer("");
    setQuestionIndex((previous) => previous + 1);
    questionStartedAt.current = typeof performance === "undefined" ? 0 : performance.now();
  }, [finishGame, localPlayer, questionIndex, questions.length]);

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

            {joinError ? (
              <div className="math-race-error" role="alert">
                <strong>
                  {joinError.code === "grade-mismatch"
                    ? "Sinf mos emas"
                    : joinError.code === "invalid-room"
                      ? "Room ID noto‘g‘ri"
                      : "Multiplayer ulanmadi"}
                </strong>
                <p>{joinError.message}</p>
                {joinError.code === "permission" ||
                joinError.code === "unavailable" ||
                joinError.code === "unknown" ||
                joinError.code === "not-configured" ? (
                  <div className="math-race-error-actions">
                    <button type="button" onClick={() => joinRace(selectedGrade)} style={secondaryButtonStyle}>
                      Qayta urinish
                    </button>
                    <button type="button" onClick={() => setLocalOnly(true)} style={secondaryButtonStyle}>
                      Lokal rejimda davom etish
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {localOnly ? (
              <div className="math-race-error math-race-error-info" role="status">
                <strong>Lokal rejim yoqilgan</strong>
                <p>Multiplayer ishlamayapti: faqat siz o‘z mashinangizni ko‘ryapsiz.</p>
                <button type="button" onClick={() => setLocalOnly(false)} style={secondaryButtonStyle}>
                  Multiplayerni yoqish
                </button>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {(["5-6", "7-9"] as GradeGroup[]).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => joinRace(grade)}
                  disabled={connectionState === "connecting"}
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(125,211,252,0.7)",
                    borderRadius: 18,
                    padding: 22,
                    textAlign: "left",
                    cursor: connectionState === "connecting" ? "wait" : "pointer",
                    color: "#f8fafc",
                    opacity: connectionState === "connecting" ? 0.6 : 1,
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
        connection={connectionState === "connected" ? "online" : localOnly ? "local" : "offline"}
      />

      <RallyTrack players={trackPlayers} selfId={playerId} nowMs={nowMs} />

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
  cursor: "pointer",
};
