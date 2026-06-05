"use client";

import Link from "next/link";
import methods from "@/data/methods.json";
import quizzes from "@/data/quizzes.json";

export default function TeacherMethodsPage() {
  function quizForMethod(methodId) {
    return quizzes.find((q) => q.methodId === methodId);
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">O&apos;qituvchi metodlari katalogi</div>
        <div className="muted">
          Metodni tanlang, o&apos;qing, refleksiya yozing va mini-quiz yeching.
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn btnGhost" href="/methods">Metodlar bo&apos;limiga qaytish</Link>
        </div>
      </div>

      <div className="list" style={{ marginTop: 14 }}>
        {methods.map((m) => {
          const q = quizForMethod(m.id);
          return (
            <div className="card" key={m.id}>
              <div className="itemTitle">{m.title}</div>
              <div className="itemMeta">
                <span className="badge">Kategoriya: {m.category}</span>
                <span className="badge">Daraja: {m.difficulty}</span>
                <span className="badge">~{m.estimatedMinutes} daqiqa</span>
                {m.tags?.slice(0, 3).map((t) => (
                  <span className="badge" key={t}>#{t}</span>
                ))}
              </div>

              <p className="muted" style={{ marginTop: 10 }}>{m.description}</p>

              <div className="row" style={{ marginTop: 10 }}>
                <Link className="btn btnGhost" href={`/method?id=${m.id}`}>Metodni ochish</Link>
                {q && <Link className="btn" href={`/quiz?id=${q.id}`}>Mini-quiz</Link>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
