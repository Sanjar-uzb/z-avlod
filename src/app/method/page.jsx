"use client";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import methods from "@/data/methods.json";
import quizzes from "@/data/quizzes.json";
import Link from "next/link";
import { addReflection, getProfile, requireProfile } from "@/lib/storage";

export default function MethodDetail() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = Number(sp.get("id") || 0);

  useEffect(() => {
    if (!requireProfile()) router.push("/start");
  }, [router]);

  const method = useMemo(() => methods.find(m => m.id === id), [id]);
  const quiz = useMemo(() => quizzes.find(q => q.methodId === id), [id]);

  const [text, setText] = useState("");

  if (!method) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Metod topilmadi</div>
          <Link className="btn btnGhost" href="/methods">Orqaga</Link>
        </div>
      </div>
    );
  }

  function saveReflection() {
    const p = getProfile();
    if (!text.trim()) {
      alert("Refleksiya matnini yozing.");
      return;
    }
    addReflection({
      methodId: method.id,
      methodTitle: method.title,
      student: `${p.firstName} ${p.lastName}`,
      org: p.org || "",
      text: text.trim(),
    });
    setText("");
    alert("Refleksiya saqlandi!");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">{method.title}</div>
        <div className="itemMeta">
          <span className="badge">Kategoriya: {method.category}</span>
          <span className="badge">Daraja: {method.difficulty}</span>
          <span className="badge">~{method.estimatedMinutes} daqiqa</span>
        </div>

        <p className="muted" style={{marginTop: 10}}>{method.description}</p>

        <hr className="hr" />

        <div className="h3">Qadam-baqadam</div>
        <ol>
          {method.steps.map((s, i) => <li key={i} style={{marginBottom: 6}}>{s}</li>)}
        </ol>

        <hr className="hr" />

        <div className="h3">Baholash mezonlari</div>
        <ul>
          {method.assessment.map((a, i) => <li key={i} style={{marginBottom: 6}}>{a}</li>)}
        </ul>

        <hr className="hr" />

        <div className="h3">Refleksiya savollari</div>
        <ul>
          {method.reflectionPrompts.map((r, i) => <li key={i} style={{marginBottom: 6}}>{r}</li>)}
        </ul>

        <div style={{marginTop: 12}}>
          <div className="h3">Refleksiya matni</div>
          <textarea
            className="input"
            style={{minHeight: 120}}
            value={text}
            onChange={(e)=>setText(e.target.value)}
            placeholder="Refleksiyangizni yozing..."
          />
          <div className="row" style={{marginTop: 10}}>
            <button className="btn" onClick={saveReflection}>Refleksiyani saqlash</button>
            <Link className="btn btnGhost" href="/reflections">Refleksiyalarni ko‘rish</Link>
            {quiz && <Link className="btn btnGhost" href={`/quiz?id=${quiz.id}`}>Mini-quiz</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
