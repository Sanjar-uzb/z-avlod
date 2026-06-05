"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import subjects from "@/data/subjects.json";
import easy from "@/data/subject_easy.json";
import medium from "@/data/subject_medium.json";
import { saveSubjectResult } from "@/lib/storage";

const QUIZ_SIZE = 10;

function levelFromPercent(p) {
  if (p >= 90) return { title: "A'lo", cls: "success" };
  if (p >= 70) return { title: "Yaxshi", cls: "warn" };
  return { title: "Boshlang'ich", cls: "danger" };
}

function pickRandomQuestions(items, count) {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function PlayClient() {
  const sp = useSearchParams();

  const name = (sp.get("name") || "").toLowerCase();
  const level = (sp.get("level") || "easy").toLowerCase(); // easy | medium
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  const subject = useMemo(() => subjects.find((s) => s.key === name) || null, [name]);

  const questionBank = useMemo(() => {
    const base = level === "medium" ? medium : easy;
    return base.filter((q) => q.subject === name);
  }, [name, level]);

  const questions = useMemo(
    () => pickRandomQuestions(questionBank, QUIZ_SIZE),
    [questionBank, replayKey]
  );

  // Timer: easy=25s, medium=20s
  const initialTime = level === "medium" ? 20 : 25;
  const [timeLeft, setTimeLeft] = useState(initialTime);

  const [finished, setFinished] = useState(false);

  const q = questions[i];
  const totalRaw = questions.length * (10 + initialTime);
  const score100 = totalRaw ? Math.round((score / totalRaw) * 100) : 0;

  useEffect(() => {
    if (!name) return;
    if (!subject) return;
    if (!questions.length) return;

    setTimeLeft(initialTime);
    setPicked(null);

    const t = setInterval(() => {
      setTimeLeft((v) => v - 1);
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, name, level]);

  useEffect(() => {
    if (!q) return;
    if (finished) return;
    if (timeLeft > 0) return;

    // time out -> next
    next(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (!name || !subject) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Parametr xato</div>
          <Link className="btn btnGhost" href="/subjects">O‘yinlar</Link>
        </div>
      </div>
    );
  }

  if (!questionBank.length) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Savollar topilmadi</div>
          <p className="muted">Bu fan/daraja uchun data hali to‘ldirilmagan.</p>
          <Link className="btn btnGhost" href={`/subject?name=${name}&level=${level}`}>Orqaga</Link>
        </div>
      </div>
    );
  }

  function pick(choiceId) {
    if (picked) return;
    setPicked(choiceId);

    const ok = choiceId === q.correctChoiceId;
    // tezkor ball: qolgan soniya ham hisobga olinadi
    const add = ok ? 10 + Math.max(0, timeLeft) : 0;
    if (ok) setScore((s) => s + add);

    // 600msdan keyin keyingisi
    setTimeout(() => next(ok), 600);
  }

  function next() {
    const last = i >= questions.length - 1;
    if (last) {
      setFinished(true);

      const total = 100;
      const percent = score100;
      const lvl = levelFromPercent(percent);

      const payload = {
        subject: name,
        subjectTitle: subject.title,
        level,
        totalQuestions: questions.length,
        score: score100,
        total,
        percent,
        grade: lvl.title,
      };

      saveSubjectResult(payload);
      return;
    }
    setI((x) => x + 1);
  }

  function replay() {
    setI(0);
    setPicked(null);
    setScore(0);
    setTimeLeft(initialTime);
    setFinished(false);
    setReplayKey((x) => x + 1);
  }

  if (finished) {
    const total = 100;
    const percent = score100;
    const lvl = levelFromPercent(percent);

    return (
      <div className="container">
        <div className="card">
          <div className="h2">Natija</div>
          <p className="muted">
            Fan: <b>{subject.title}</b> • Daraja: <b>{level === "medium" ? "7–9" : "5–6"}</b>
          </p>

          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">Ball: {score100}/{total}</span>
            <span className="badge">Foiz: {percent}%</span>
            <span className={`badge ${lvl.cls}`}>Daraja: {lvl.title}</span>
          </div>

          <p className="muted" style={{ marginTop: 10 }}>
            Natija shu qurilmada saqlandi. Keyin xohlasangiz reyting ham qo‘shamiz.
          </p>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={replay}>Qayta o‘ynash</button>
            <Link className="btn btnGhost" href={`/subject?name=${name}&level=${level}`}>Savollar</Link>
            <Link className="btn btnGhost" href="/subjects">Boshqa fan</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h3">{subject.title} • {level === "medium" ? "7–9 sinf" : "5–6 sinf"}</div>
            <div className="muted">Savol {i + 1} / {questions.length}</div>
          </div>
          <div className="row">
            <span className="badge">⏱ {timeLeft}s</span>
            <span className="badge">Ball: {score100}/100</span>
          </div>
        </div>

        <hr className="hr" />

        <div className="itemTitle" style={{ fontSize: 18 }}>
          {q.question}
        </div>

        <div className="list" style={{ marginTop: 12 }}>
          {q.choices.map((c) => {
            const selected = picked === c.id;
            const correct = picked && c.id === q.correctChoiceId;
            const wrong = selected && c.id !== q.correctChoiceId;

            return (
              <button
                key={c.id}
                className={`btn ${selected ? "" : "btnGhost"}`}
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  opacity: picked ? 0.9 : 1
                }}
                onClick={() => pick(c.id)}
                disabled={!!picked}
              >
                <span style={{ fontWeight: 800, minWidth: 22 }}>
                  {c.id}
                </span>
                <span>
                  {c.text}
                  {picked && correct ? " ✅" : ""}
                  {picked && wrong ? " ❌" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn btnGhost" href="/subjects">
            Chiqish
          </Link>
        </div>
      </div>
    </div>
  );
}

