"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import quizzes from "@/data/quizzes.json";
import methods from "@/data/methods.json";
import { requireProfile, saveQuizResult, getProfile } from "@/lib/storage";
import { scoreQuiz, levelFromPercent } from "@/lib/scoring";
import Link from "next/link";

export default function QuizClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = Number(sp.get("id") || 0);

  useEffect(() => {
    if (!requireProfile()) router.push("/start");
  }, [router]);

  const quiz = useMemo(() => quizzes.find((q) => q.id === id), [id]);
  const method = useMemo(() => {
    if (!quiz) return null;
    return methods.find((m) => m.id === quiz.methodId) || null;
  }, [quiz]);

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  if (!quiz) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Quiz topilmadi</div>
          <Link className="btn btnGhost" href="/methods">Orqaga</Link>
        </div>
      </div>
    );
  }

  function pick(qid, cid) {
    setAnswers((prev) => ({ ...prev, [qid]: cid }));
  }

  function submit() {
    const res = scoreQuiz(quiz, answers);
    const p = getProfile();
    const lvl = levelFromPercent(res.percent);

    const payload = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      methodId: quiz.methodId,
      methodTitle: method?.title || "",
      student: `${p.firstName} ${p.lastName}`,
      org: p.org || "",
      ...res,
      level: lvl.title,
    };

    saveQuizResult(quiz.id, payload);
    setResult(payload);
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">{quiz.title}</div>
        {method && (
          <div className="muted">
            Metod: <b>{method.title}</b>
          </div>
        )}

        <hr className="hr" />

        {quiz.questions.map((q) => (
          <div key={q.id} className="card" style={{ marginBottom: 12 }}>
            <div className="itemTitle">{q.text}</div>

            <div className="list" style={{ marginTop: 8 }}>
              {q.choices.map((c) => {
                const checked = Number(answers[q.id] || 0) === c.id;
                return (
                  <label key={c.id} className="row" style={{ alignItems: "center" }}>
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={checked}
                      onChange={() => pick(q.id, c.id)}
                    />
                    <span>{c.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={submit}>Natijani chiqarish</button>
          {method && (
            <Link className="btn btnGhost" href={`/method?id=${method.id}`}>
              Metodga qaytish
            </Link>
          )}
          <Link className="btn btnGhost" href="/profile">Profil</Link>
        </div>

        {result && (
          <>
            <hr className="hr" />
            <div className="h3">Natija</div>
            <div className="row" style={{ alignItems: "center" }}>
              <span className="badge">Ball: {result.score}/{result.total}</span>
              <span className="badge">Foiz: {result.percent}%</span>
              <span className={`badge ${levelFromPercent(result.percent).cls}`}>
                Daraja: {result.level}
              </span>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              Natija saqlandi (shu qurilmada). Keyin backend qo‘shsak, barcha qurilmada ishlaydi.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
