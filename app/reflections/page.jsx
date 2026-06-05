"use client";
import { useEffect, useMemo, useState } from "react";
import { getReflections, getStudentSurveyResults, getAllGameResults, getKahootGameResults, getElectricGameResults, getSubjectResults, getMethodQuizResults } from "@/lib/storage";
import Link from "next/link";
import methods from "@/data/methods.json";

export default function ReflectionsPage() {
  const [items, setItems] = useState([]);
  const [surveyResults, setSurveyResults] = useState([]);
  const [gameResults, setGameResults] = useState([]);
  const [kahootResults, setKahootResults] = useState([]);
  const [electricResults, setElectricResults] = useState([]);
  const [subjectResults, setSubjectResults] = useState([]);
  const [methodQuizResults, setMethodQuizResults] = useState([]);

  useEffect(() => {
    setItems(getReflections());
    setSurveyResults(getStudentSurveyResults());
    setGameResults(getAllGameResults());
    setKahootResults(getKahootGameResults());
    setElectricResults(getElectricGameResults());
    setSubjectResults(getSubjectResults());
    setMethodQuizResults(getMethodQuizResults());
  }, []);

  const byMethod = useMemo(() => {
    const map = {};
    for (const m of methods) map[m.id] = m.title;
    return map;
  }, []);

  const latestSurvey = useMemo(() => surveyResults[0] || null, [surveyResults]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("uz-UZ");
  };

  return (
    <div className="container">
      <div className="card">
        <div className="h2">Refleksiyalar va o'yin natijalari</div>
        <div className="muted">O'yinlar, so'rovnomalar va refleksiyalar shu qurilmada saqlanadi.</div>
      </div>

      {/* Game Results Summary */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="h3">O'yin va test natijalari</div>
        <div className="muted">
          Barcha o'yinlar va testlar natijalari shu bo'limda yig'inishadi.
        </div>

        <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
          {kahootResults.length > 0 && (
            <div className="badge">
              Kahoot o'yinlari: {kahootResults.length}
            </div>
          )}
          {electricResults.length > 0 && (
            <div className="badge">
              Elektr zanjirlash: {electricResults.length}
            </div>
          )}
          {subjectResults.length > 0 && (
            <div className="badge">
              Fan testlari: {subjectResults.length}
            </div>
          )}
          {methodQuizResults.length > 0 && (
            <div className="badge">
              Metod testlari: {methodQuizResults.length}
            </div>
          )}
          {gameResults.length === 0 && subjectResults.length === 0 && methodQuizResults.length === 0 && (
            <div className="muted">Hali o'yin va test natijalari yo'q.</div>
          )}
        </div>
      </div>

      {/* Kahoot Game Results */}
      {kahootResults.length > 0 && (
        <div style={{marginTop: 14}}>
          <div className="h3" style={{marginBottom: 10}}>Kahoot o'yini natijalari</div>
          <div className="list">
            {kahootResults.map((result, idx) => (
              <div className="card" key={`kahoot_${idx}`}>
                <div className="itemTitle">{result.title}</div>
                <div className="itemMeta">
                  <span className="badge">O'quvchi: {result.student}</span>
                  <span className="badge">Ballar: {result.score}</span>
                  <span className="badge">{result.correctAnswers}/{result.totalQuestions} to'g'ri</span>
                  <span className="badge">O'rni: {result.playerPosition}/{result.totalParticipants}</span>
                  <span className="badge">Sana: {formatDate(result.savedAt)}</span>
                </div>
                {result.results && result.results.length > 0 && (
                  <div style={{marginTop: 10, fontSize: 13, color: "#666"}}>
                    <div style={{fontWeight: 500, marginBottom: 6}}>Ishtirokchilar sifat tizimi:</div>
                    {result.results.slice(0, 3).map((player, i) => (
                      <div key={i}>• {i + 1}. {player.name}: {player.score} ball</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Electric Game Results */}
      {electricResults.length > 0 && (
        <div style={{marginTop: 14}}>
          <div className="h3" style={{marginBottom: 10}}>Elektr zanjirlash o'yini natijalari</div>
          <div className="list">
            {electricResults.map((result, idx) => (
              <div className="card" key={`electric_${idx}`}>
                <div className="itemTitle">{result.title}</div>
                <div className="itemMeta">
                  <span className="badge">O'quvchi: {result.student}</span>
                  <span className="badge">Bosqichlar: {result.levelsCompleted}/{result.totalLevels}</span>
                  <span className="badge">Vaqt: {result.completionTime}s</span>
                  <span className="badge">Sana: {formatDate(result.savedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Quiz Results */}
      {subjectResults.length > 0 && (
        <div style={{marginTop: 14}}>
          <div className="h3" style={{marginBottom: 10}}>Fan testi natijalari</div>
          <div className="list">
            {subjectResults.map((result, idx) => (
              <div className="card" key={`subject_${idx}`}>
                <div className="itemTitle">{result.subjectTitle} — {result.level === "medium" ? "7–9 sinf (o'rta)" : "5–6 sinf (oson)"}</div>
                <div className="itemMeta">
                  <span className="badge">O'quvchi: {result.student}</span>
                  <span className="badge">Ball: {result.score}/{result.total}</span>
                  <span className="badge">Foiz: {result.percent}%</span>
                  <span className={`badge`} style={{backgroundColor: result.percent >= 90 ? "#22c55e" : result.percent >= 70 ? "#f59e0b" : "#ef4444", color: "#fff"}}>
                    {result.grade}
                  </span>
                  <span className="badge">Sana: {formatDate(result.savedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method Quiz Results */}
      {methodQuizResults.length > 0 && (
        <div style={{marginTop: 14}}>
          <div className="h3" style={{marginBottom: 10}}>Metod testi natijalari</div>
          <div className="list">
            {methodQuizResults.map((result, idx) => (
              <div className="card" key={`method_quiz_${idx}`}>
                <div className="itemTitle">{result.methodTitle} — {result.quizTitle}</div>
                <div className="itemMeta">
                  <span className="badge">O'quvchi: {result.student}</span>
                  <span className="badge">To'g'ri: {result.correctAnswers}/{result.totalQuestions}</span>
                  <span className="badge">Foiz: {result.percent}%</span>
                  <span className={`badge`} style={{backgroundColor: result.percent >= 90 ? "#22c55e" : result.percent >= 70 ? "#f59e0b" : "#ef4444", color: "#fff"}}>
                    {result.level}
                  </span>
                  <span className="badge">Sana: {formatDate(result.savedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="h3">So'rovnoma tahlillari</div>
        <div className="muted">
          O'quvchi so'rovnomalari va sinf bo'yicha umumiy natijalarni shu bo'limdan kuzatib borishingiz mumkin.
        </div>

        {latestSurvey ? (
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge">So'nggi o'quvchi: {latestSurvey.student || "Noma'lum"}</span>
            <span className="badge">Sinf: {latestSurvey.className || latestSurvey.studentInfo?.grade || latestSurvey.org || "-"}</span>
            <span className="badge">Javoblar: {latestSurvey.answeredCount}/{latestSurvey.totalStatements}</span>
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 12 }}>
            Hali saqlangan so'rovnoma natijasi yo'q.
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn" href="/methods/student/results">Natijalar tahliliga o'tish</Link>
        </div>
      </div>

      {/* Text Reflections */}
      <div style={{marginTop: 14}}>
        <div className="h3" style={{marginBottom: 10}}>Yozilgan refleksiyalar</div>
        <div className="list">
        {items.length === 0 ? (
          <div className="card">
            <div className="muted">Hali refleksiya yo‘q.</div>
            <div className="row" style={{marginTop: 10}}>
              <Link className="btn" href="/methods">Metodlarni ochish</Link>
            </div>
          </div>
        ) : (
          items.map((r, idx) => (
            <div className="card" key={idx}>
              <div className="itemTitle">{byMethod[r.methodId] || r.methodTitle || "Metod"}</div>
              <div className="itemMeta">
                <span className="badge">O‘quvchi: {r.student}</span>
                {r.org ? <span className="badge">Sinf/Guruh: {r.org}</span> : null}
                <span className="badge">Sana: {formatDate(r.createdAt)}</span>
              </div>
              <p style={{whiteSpace:"pre-wrap", marginTop: 10}}>{r.text}</p>
              <div className="row" style={{marginTop: 10}}>
                <Link className="btn btnGhost" href={`/method?id=${r.methodId}`}>Metod</Link>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
