"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

import {
  listenPlayers,
  listenRoom,
  nextQuestion,
  showResult,
  startQuestion,
  submitAnswer,
  type PlayerEntry,
  type RoomPhase,
  type RoomState,
} from "@/lib/kahootLive";

import { saveKahootGameResult } from "@/lib/storage";

const TICK_MS = 200;
const AUTO_NEXT_MS = 8000;

const PHASE_LABEL: Record<RoomPhase, string> = {
  LOBBY: "Kutish zali",
  QUESTION: "Savol",
  RESULT: "Natija",
  FINISHED: "Yakunlandi",
};

function errMessage(e: unknown) {
  return e instanceof Error && e.message ? e.message : "Xatolik.";
}

function reasonText(reason: string) {
  switch (reason) {
    case "room-not-found":
      return "Room topilmadi.";
    case "player-not-found":
      return "O‘yinchi topilmadi. Qaytadan kiring.";
    case "not-question":
      return "Savol faol emas.";
    case "not-result":
      return "Natija bosqichi emas.";
    case "not-lobby":
      return "O‘yin allaqachon boshlangan.";
    case "not-expired":
      return "Vaqt hali tugamagan.";
    case "too-late":
      return "Vaqt tugadi.";
    case "already-answered":
      return "Bu savolga allaqachon javob berdingiz.";
    case "stale-question":
      return "Savol almashib ketdi.";
    case "stale":
      return "Holat yangilandi.";
    default:
      return "Amalni bajarib bo‘lmadi.";
  }
}

export default function PlayClient() {
  const sp = useSearchParams();

  const pin = sp.get("pin") || "";
  const role = sp.get("role") || "player";
  const pid = sp.get("pid") || "";
  const name = sp.get("name") || "";

  const isHost = role === "host";

  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [pick, setPick] = useState<{ qid: number; choiceId: number } | null>(null);
  const [lockedQid, setLockedQid] = useState<number | null>(null);
  const [info, setInfo] = useState<{ qid: number; text: string } | null>(null);

  const [autoNext, setAutoNext] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const autoResultRef = useRef("");
  const autoNextRef = useRef("");

  const phase: RoomPhase | null = room?.phase ?? null;
  const qIndex = room?.qIndex ?? 0;
  const startedAtMs = room?.startedAtMs ?? null;
  const resultAtMs = room?.resultAtMs ?? null;
  const totalTimeSec = room?.timePerQuestionSec || 15;
  const totalQuestions = room?.questions?.length || 0;
  const roomPin = room?.pin || pin;
  const roomTitle = room?.title || "";

  useEffect(() => {
    if (!pin) return;

    const unsubRoom = listenRoom(
      pin,
      (snapshot) => {
        setRoom(snapshot);
        setLoaded(true);
        setLoadError("");
      },
      () => {
        setLoadError("Room ma’lumotini yuklab bo‘lmadi. Internet yoki Firebase ruxsatini tekshiring.");
        setLoaded(true);
      }
    );

    const unsubPlayers = listenPlayers(
      pin,
      (list) => setPlayers(list),
      () => setLoadError("O‘yinchilar ro‘yxatini yuklab bo‘lmadi.")
    );

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [pin]);

  const joinUrl = useMemo(() => {
    if (!roomPin || typeof window === "undefined") return "";

    const { origin, pathname } = window.location;
    const marker = "/games/kahoot";
    const idx = pathname.indexOf(marker);
    const base = idx >= 0 ? pathname.slice(0, idx) : "";

    return `${origin}${base}${marker}/?pin=${encodeURIComponent(roomPin)}`;
  }, [roomPin]);

  useEffect(() => {
    if (!phase || (phase !== "QUESTION" && phase !== "RESULT")) return;

    const id = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [phase, qIndex, startedAtMs, resultAtMs]);

  const q = useMemo(() => {
    if (!room) return null;
    if (room.phase !== "QUESTION" && room.phase !== "RESULT") return null;
    return room.questions?.[room.qIndex] ?? null;
  }, [room]);

  const me = useMemo(
    () => (pid ? players.find((p) => p.id === pid) ?? null : null),
    [players, pid]
  );

  const elapsedSec =
    phase === "QUESTION" && startedAtMs
      ? Math.max(0, (nowMs - startedAtMs) / 1000)
      : 0;

  const remainingSec =
    phase === "QUESTION" ? Math.max(0, totalTimeSec - elapsedSec) : 0;

  const secLeft = Math.ceil(remainingSec);
  const progressPct =
    totalTimeSec > 0
      ? Math.max(0, Math.min(100, (remainingSec / totalTimeSec) * 100))
      : 0;

  const expired =
    phase === "QUESTION" && Boolean(startedAtMs) && elapsedSec >= totalTimeSec;

  const answeredCount = q
    ? players.filter((p) => p.data.lastAnswer?.qid === q.id).length
    : 0;

  const myAnswer = me?.data.lastAnswer;
  const myPosition = me ? players.findIndex((p) => p.id === pid) + 1 : 0;
  const top3 = players.slice(0, 3);

  const lastForQ = q && myAnswer?.qid === q.id ? myAnswer : null;
  const picked =
    pick && q && pick.qid === q.id ? pick.choiceId : (lastForQ?.pickedId ?? null);
  const locked = (q ? lockedQid === q.id : false) || Boolean(lastForQ);
  const infoText =
    info && q && info.qid === q.id
      ? info.text
      : lastForQ
        ? "Javobingiz qabul qilingan."
        : "";

  const autoNextIn =
    phase === "RESULT" && resultAtMs
      ? Math.max(0, Math.ceil((AUTO_NEXT_MS - (nowMs - resultAtMs)) / 1000))
      : 0;

  useEffect(() => {
    if (phase !== "QUESTION") return;
    if (autoResultRef.current === String(qIndex)) return;
    if (!expired) return;
    if (!isHost) return;

    autoResultRef.current = String(qIndex);

    showResult(pin)
      .then((res) => {
        if (!res.ok && res.reason !== "not-question") {
          autoResultRef.current = "";
        }
      })
      .catch(() => {
        autoResultRef.current = "";
      });
  }, [expired, isHost, phase, pin, qIndex]);

  useEffect(() => {
    if (!isHost || !autoNext) return;
    if (phase !== "RESULT") return;

    const left = AUTO_NEXT_MS - (nowMs - (resultAtMs || 0));
    if (left > 0) return;
    if (autoNextRef.current === String(qIndex)) return;

    autoNextRef.current = String(qIndex);

    nextQuestion(pin, qIndex)
      .then((res) => {
        if (!res.ok && res.reason !== "not-result" && res.reason !== "stale") {
          autoNextRef.current = "";
        }
      })
      .catch(() => {
        autoNextRef.current = "";
      });
  }, [autoNext, isHost, nowMs, phase, pin, qIndex, resultAtMs]);

  useEffect(() => {
    if (phase !== "FINISHED") return;
    if (isHost || !pid) return;

    const key = `zavlod_kahoot_saved_${roomPin}_${pid}`;

    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    const idx = players.findIndex((p) => p.id === pid);
    if (idx < 0) return;

    try {
      localStorage.setItem(key, "1");
    } catch {
      return;
    }

    const player = players[idx];

    saveKahootGameResult({
      title: roomTitle || "Kahoot Live",
      student: player.data.name || name,
      playerCount: players.length,
      playerPosition: idx + 1,
      score: player.data.score || 0,
      totalQuestions,
      correctAnswers: player.data.correct || 0,
      totalParticipants: players.length,
      results: players.map((p) => ({
        name: p.data.name,
        score: p.data.score || 0,
        correct: p.data.correct || 0,
      })),
    });
  }, [
    players,
    pid,
    isHost,
    phase,
    roomPin,
    roomTitle,
    totalQuestions,
    name,
  ]);

  async function copyPin() {
    if (!roomPin) return;

    try {
      await navigator.clipboard.writeText(roomPin);
    } catch {
      const input = document.createElement("input");
      input.value = roomPin;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyJoinLink() {
    if (!joinUrl) return;

    try {
      await navigator.clipboard.writeText(joinUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      setActionError("Havolani nusxalab bo‘lmadi. Havolani qo‘lda nusxalang.");
    }
  }

  async function answer(choiceId: number) {
    if (!q || !room || room.phase !== "QUESTION") return;
    if (locked) return;

    setPick({ qid: q.id, choiceId });
    setLockedQid(q.id);
    setInfo({ qid: q.id, text: "Yuborilmoqda..." });
    setActionError("");

    try {
      const res = await submitAnswer(pin, pid, { qid: q.id, pickedId: choiceId });

      if (res.ok) {
        setInfo({ qid: q.id, text: "Javobingiz qabul qilindi." });
        return;
      }

      if (res.reason === "already-answered") {
        setInfo({ qid: q.id, text: "Javobingiz qabul qilingan." });
        return;
      }

      setLockedQid(null);
      setPick(null);
      setInfo(null);
      setActionError(reasonText(res.reason));
    } catch (e) {
      setLockedQid(null);
      setPick(null);
      setInfo(null);
      setActionError(errMessage(e));
    }
  }

  async function onStart() {
    setActionError("");
    try {
      const res = await startQuestion(pin);
      if (!res.ok) setActionError(reasonText(res.reason));
    } catch (e) {
      setActionError(errMessage(e));
    }
  }

  async function onShowResult() {
    setActionError("");
    try {
      const res = await showResult(pin, { force: true });
      if (!res.ok) setActionError(reasonText(res.reason));
    } catch (e) {
      setActionError(errMessage(e));
    }
  }

  async function onNext() {
    setActionError("");
    try {
      const res = await nextQuestion(pin, qIndex);
      if (!res.ok) setActionError(reasonText(res.reason));
    } catch (e) {
      setActionError(errMessage(e));
    }
  }

  if (!pin) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">PIN ko‘rsatilmagan</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Host PIN yaratishi yoki havola/QR kod orqali kirish kerak.
          </p>
          <Link className="btn btnGhost" href="/games/kahoot">
            Kahoot sahifasiga
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Ulanish xatosi</div>
          <p className="muted" style={{ marginTop: 8 }}>{loadError}</p>
          <Link className="btn btnGhost" href="/games/kahoot">
            Orqaga
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container">
        <div className="card">
          {loaded ? (
            <>
              <div className="h2">Bunday PIN topilmadi</div>
              <p className="muted" style={{ marginTop: 8 }}>
                PIN <b>{pin}</b> bo‘yicha xona topilmadi yoki u o‘chirilgan.
              </p>
              <Link className="btn btnGhost" href="/games/kahoot/join">
                Boshqa PIN bilan kirish
              </Link>
            </>
          ) : (
            <div>Room yuklanmoqda...</div>
          )}
        </div>
      </div>
    );
  }

  const isLastQuestion = qIndex + 1 >= totalQuestions;

  return (
    <div className="container">
      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card kahootMain">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="h2">{roomTitle || "Kahoot Live"}</div>
              <div className="muted">
                {PHASE_LABEL[room.phase]}
                {room.phase !== "LOBBY" && totalQuestions > 0
                  ? ` · Savol ${qIndex + 1}/${totalQuestions}`
                  : ""}
              </div>
            </div>

            <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span className="badge">PIN {roomPin}</span>

              {isHost && room.phase === "LOBBY" && (
                <button className="btn btnLarge" onClick={onStart}>
                  Boshlash
                </button>
              )}
            </div>
          </div>

          <hr className="hr" />

          {room.phase === "LOBBY" && (
            <>
              {isHost ? (
                <div className="kahootLobby">
                  <div>
                    <div className="muted">O‘quvchilar shu PIN bilan kiradi</div>
                    <div className="kahootPinBox">
                      <div className="kahootPinDigits">{roomPin}</div>
                      <button className="btn btnGhost" onClick={copyPin} style={{ marginTop: 10 }}>
                        {copied ? "Nusxalandi ✓" : "PIN nusxalash"}
                      </button>
                    </div>

                    <div className="kahootJoinUrl">{joinUrl || "Havola tayyorlanmoqda..."}</div>

                    <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                      <button className="btn btnGhost" onClick={copyJoinLink} disabled={!joinUrl}>
                        {linkCopied ? "Nusxalandi ✓" : "Havolani nusxalash"}
                      </button>
                      <Link className="btn btnGhost" href="/games/kahoot/join">
                        O‘quvchi sahifasi
                      </Link>
                    </div>
                  </div>

                  <div className="kahootQrWrap">
                    <div className="kahootQr">
                      {joinUrl ? (
                        <QRCodeSVG
                          value={joinUrl}
                          size={200}
                          level="M"
                          marginSize={2}
                          bgColor="#ffffff"
                          fgColor="#0b1020"
                          title="Kahoot Live join QR"
                        />
                      ) : (
                        <div className="muted">QR tayyorlanmoqda...</div>
                      )}
                    </div>
                    <div className="muted" style={{ textAlign: "center", marginTop: 8 }}>
                      Telefon kamerasi bilan skanerlang
                    </div>
                  </div>
                </div>
              ) : (
                <div className="kahootWait">
                  <div className="h3">Siz {me?.data.name || name || "o‘yinchi"} sifatida kirdingiz</div>
                  <p className="muted">
                    O‘qituvchi o‘yinni boshlashini kutmoqda. Sahifani yopmang.
                  </p>
                  <div className="kahootWaitDots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div className="muted" style={{ marginTop: 12 }}>
                Kutish zalida: <b>{players.length}</b> o‘yinchi
              </div>
            </>
          )}

          {room.phase === "QUESTION" && q && (
            <>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="h3">Savol {qIndex + 1}/{totalQuestions}</div>
                <span className={`badge${expired ? " kahootTimeUp" : ""}`}>
                  {expired ? "Vaqt tugadi" : `${secLeft}s`}
                </span>
              </div>

              <div className="kahootTimerBar" style={{ marginTop: 8 }}>
                <div
                  className="kahootTimerFill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {isHost ? (
                <>
                  <div className="card kahootProjector" style={{ marginTop: 14 }}>
                    <div className="kahootProjectorQuestion">{q.text}</div>

                    <div className="grid" style={{ marginTop: 14 }}>
                      {q.choices.map((c, i) => (
                        <div
                          key={c.id}
                          className={`kahootColorCard card${i + 1}`}
                          style={{ gridColumn: "span 6" }}
                        >
                          <span className="kahootProjectorChoice">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row" style={{ marginTop: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div className="muted">
                      Javob berdi: <b>{answeredCount}</b> / {players.length}
                    </div>
                    <button className="btn btnGhost" onClick={onShowResult}>
                      Natijani ko‘rsatish
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="h3" style={{ marginTop: 12 }}>{q.text}</div>

                  <div className="grid" style={{ marginTop: 12 }}>
                    {q.choices.map((c, i) => (
                      <button
                        key={c.id}
                        className={`kahootChoice kahootColorBtn color${i + 1}${picked === c.id ? " picked" : ""}`}
                        onClick={() => answer(c.id)}
                        disabled={locked || expired}
                        style={{ gridColumn: "span 6" }}
                      >
                        <span className="kahootChoiceText">{c.text}</span>
                      </button>
                    ))}
                  </div>

                  {infoText && (
                    <p className="muted" style={{ marginTop: 10 }}>{infoText}</p>
                  )}

                  <div className="muted" style={{ marginTop: 6 }}>
                    Javob berganlar: <b>{answeredCount}</b> / {players.length}
                  </div>
                </>
              )}
            </>
          )}

          {room.phase === "RESULT" && q && (
            <>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="h3">Natija · Savol {qIndex + 1}/{totalQuestions}</div>
                {isHost && autoNext && (
                  <span className="badge">
                    Keyingisi: {autoNextIn}s
                  </span>
                )}
              </div>

              <div className="card kahootProjector" style={{ marginTop: 12 }}>
                <div className="kahootProjectorQuestion">{q.text}</div>

                <div className="grid" style={{ marginTop: 14 }}>
                  {q.choices.map((c, i) => {
                    const isCorrect = c.id === q.answerId;
                    const isMyPick = myAnswer?.pickedId === c.id;
                    const highlight = isCorrect
                      ? " correctAnswer"
                      : isMyPick
                        ? " wrongAnswer"
                        : " dimAnswer";

                    return (
                      <div
                        key={c.id}
                        className={`kahootColorCard card${i + 1}${highlight}`}
                        style={{ gridColumn: "span 6" }}
                      >
                        <span className="kahootProjectorChoice">
                          {c.text}
                          {isCorrect ? " ✓" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isHost && (
                <div className="kahootResultBanner" style={{ marginTop: 12 }}>
                  {myAnswer ? (
                    myAnswer.correct ? (
                      <span className="kahootGood">✓ To‘g‘ri · +{myAnswer.gained} ball</span>
                    ) : (
                      <span className="kahootBad">✕ Noto‘g‘ri javob</span>
                    )
                  ) : (
                    <span className="kahootBad">⏱ Javob berilmadi</span>
                  )}
                  <span className="muted" style={{ marginLeft: 12 }}>
                    Umumiy: <b>{me?.data.score || 0}</b> ball
                  </span>
                </div>
              )}

              {isHost && (
                <div className="row" style={{ marginTop: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <label className="row" style={{ gap: 8, alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={autoNext}
                      onChange={(e) => setAutoNext(e.target.checked)}
                    />
                    <span className="muted">Avtomatik o‘tish (8s)</span>
                  </label>

                  <button className="btn" onClick={onNext}>
                    {isLastQuestion ? "Yakunlash" : "Keyingi savol"}
                  </button>
                </div>
              )}
            </>
          )}

          {room.phase === "FINISHED" && (
            <>
              <div className="h3">Yakuniy natija</div>

              <div className="kahootPodiumWrap" style={{ marginTop: 16 }}>
                <div className="kahootPodium second">
                  <div className="kahootPodiumName">{top3[1]?.data?.name || "—"}</div>
                  <div className="kahootPodiumScore">{top3[1]?.data?.score || 0}</div>
                  <div className="kahootPodiumBase">2</div>
                </div>

                <div className="kahootPodium first">
                  <div className="kahootPodiumName">{top3[0]?.data?.name || "—"}</div>
                  <div className="kahootPodiumScore">{top3[0]?.data?.score || 0}</div>
                  <div className="kahootPodiumBase">1</div>
                </div>

                <div className="kahootPodium third">
                  <div className="kahootPodiumName">{top3[2]?.data?.name || "—"}</div>
                  <div className="kahootPodiumScore">{top3[2]?.data?.score || 0}</div>
                  <div className="kahootPodiumBase">3</div>
                </div>
              </div>

              {!isHost && me && (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="h3">Sizning natijangiz</div>
                  <div className="muted" style={{ marginTop: 6 }}>
                    O‘rin: <b>{myPosition}</b> / {players.length} · Ball: <b>{me.data.score || 0}</b> ·
                    To‘g‘ri javoblar: <b>{me.data.correct || 0}</b> / {totalQuestions}
                  </div>
                </div>
              )}

              <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
                {isHost && (
                  <Link className="btn" href="/games/kahoot/host">
                    Yangi o‘yin
                  </Link>
                )}
                <Link className="btn btnGhost" href="/games/kahoot">
                  Kahoot sahifasiga
                </Link>
              </div>
            </>
          )}

          {actionError && (
            <div
              className="card"
              style={{ marginTop: 12, borderColor: "rgba(255,107,107,.35)" }}
            >
              <div className="muted">{actionError}</div>
            </div>
          )}
        </div>

        <div className="card kahootSide">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="h3">Reyting</div>
            <div className="badge">{players.length}</div>
          </div>

          <div style={{ marginTop: 8 }}>
            {players.length === 0 && (
              <div className="muted">Hali hech kim qo‘shilmagan.</div>
            )}

            {players.map((p, i) => {
              const isMe = p.id === pid;
              return (
                <div
                  key={p.id}
                  className="module"
                  style={isMe ? { borderColor: "rgba(122,167,255,.55)" } : undefined}
                >
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {i + 1}. {p.data.name}
                      {isMe ? " (siz)" : ""}
                    </div>
                    <div className="badge">{p.data.score || 0}</div>
                  </div>
                  {(room.phase === "RESULT" || room.phase === "FINISHED") && (
                    <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                      To‘g‘ri: {p.data.correct || 0}
                      {q ? ` · Bu savolga: ${p.data.lastAnswer?.qid === q.id ? "javob berdi" : "javob yo‘q"}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <hr className="hr" />

          <Link className="btn btnGhost" href="/games/kahoot">
            Orqaga
          </Link>
        </div>
      </div>
    </div>
  );
}
