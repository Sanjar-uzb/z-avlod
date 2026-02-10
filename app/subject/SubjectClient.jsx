"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import subjects from "@/data/subjects.json";
import easy from "@/data/subject_easy.json";
import medium from "@/data/subject_medium.json";

export default function SubjectClient() {
  const sp = useSearchParams();
  const name = (sp.get("name") || "").toLowerCase();
  const level = (sp.get("level") || "easy").toLowerCase(); // easy | medium

  const subject = useMemo(() => subjects.find((s) => s.key === name) || null, [name]);

  const list = useMemo(() => {
    const base = level === "medium" ? medium : easy;
    return base.filter((q) => q.subject === name);
  }, [name, level]);

  const levelTitle = level === "medium" ? "7–9 sinf (o‘rta)" : "5–6 sinf (oson)";

  if (!subject) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Fan topilmadi</div>
          <Link className="btn btnGhost" href="/subjects">Orqaga</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card hero">
        <div className="h2">{subject.title} — {levelTitle}</div>
        <p className="muted">
          Bu bo‘limda 10 ta mini-o‘yin savoli bor. Har bir savol tezkor fikrlashni,
          diqqatni jamlashni va mavzuni mustahkamlashni rivojlantiradi.
        </p>

        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn btnGhost" href="/subjects">Fanlar</Link>
          <Link
            className="btn"
            href={`/play?name=${subject.key}&level=${level}`}
          >
            Boshlash (10 savol)
          </Link>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {list.map((q, idx) => (
          <div key={q.id} className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">Savol #{idx + 1}</div>
            <div className="itemTitle">{q.question}</div>
            <div className="muted" style={{ marginTop: 8 }}>
              Variantlar: {q.choices.map((c) => c.text).join(" • ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
