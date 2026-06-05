"use client";

import { useState } from "react";
import Link from "next/link";

const CHALLENGES = [
  {
    id: 1,
    title: "Yig'indini chiqarish (1-5)",
    description: "1 dan 5 gacha sonlar yig'indisini print() orqali chiqaruvchi kod yozing",
    code: "print()",
    expected: "print(1+2+3+4+5)",
  },
  {
    id: 2,
    title: "Matn chiqarish",
    description: "'hello' matnini print() bilan konsolga chiqaruvchi kod yozing",
    code: "print('')",
    expected: "print('hello')",
  },
  {
    id: 3,
    title: "Yig'indini chiqarish (1-10)",
    description: "1 dan 10 gacha sonlar yig'indisini print() orqali chiqaruvchi kod yozing",
    code: "print()",
    expected: "print(1+2+3+4+5+6+7+8+9+10)",
  },
  {
    id: 4,
    title: "Uchburchak",
    description: "Uchburchakning perimetrini hisoblash dasturini print() orqali chiqaruvchi kod yozing (a,b,c)",
    code: "print()",
    expected: "print(a+b+c)",
  },
  {
    id: 5,
    title: "To'rtburchak",
    description: "To'rtburchakning perimetrini hisoblash dasturini print() orqali chiqaruvchi kod yozing (a,b)",
    code: "print()",
    expected: "print(2*(a+b))",
  },
  {
    id: 6,
    title: "Ko'paytma",
    description: "3 va 4 sonini ko'paytmasini hisoblash dasturini print() orqali chiqaruvchi kod yozing",
    code: "print()",
    expected: "print(3*4)",
  },
  {
    id: 7,
    title: "O'rta arifmetik",
    description: "beshta sonning o'rta arifmetikini hisoblash dasturini print() orqali chiqaruvchi kod yozing (2,4,6,8,10)",
    code: "print()",
    expected: "print((2+4+6+8+10)/5)",
  },
  {
    id: 8,
    title: "eng katta son",
    description: "'Berilgan sonlar orasidan eng kattasini topuvchi dastur yozing (3,7,2,9,5)",
    code: "print()",
    expected: "print(max(3,7,2,9,5))",
  },
  {
    id: 9,
    title: "Eng kichik son",
    description: "'Berilgan sonlar orasidan eng kichikasini topuvchi dastur yozing (3,7,2,9,5)",
    code: "print()",
    expected: "print(min(3,7,2,9,5))",
  },
  {
    id: 10,
    title: "Uchburchakning yuzasini hisoblash",
    description: "Uchburchakning yuzasini hisoblash dasturini print() orqali chiqaruvchi kod yozing (a,b)",
    code: "print()",
    expected: "print(0.5 * a * b)",
  },
];

export default function CodingPuzzlePlay() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);

  function checkAnswer() {
    const challenge = CHALLENGES[index];
    if (answer.trim() === challenge.expected) {
      setScore(score + 10);
      setFeedback("✓ To'g'ri javob!");
      setTimeout(() => {
        const next = index + 1;
        if (next >= CHALLENGES.length) {
          setFinished(true);
        } else {
          setIndex(next);
          setAnswer("");
          setFeedback("");
        }
      }, 1000);
    } else {
      setFeedback(`✗ Noto'g'ri. Javob: ${challenge.expected}`);
    }
  }

  const challenge = CHALLENGES[index];

  return (
    <div className="container">
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>Coding Puzzle Game</h1>
          <Link className="btn btnGhost" href="/games/coding-puzzle">
            Orqaga
          </Link>
        </div>

        {!finished ? (
          <>
            <p>
              <strong>Topshiriq {index + 1}/{CHALLENGES.length}</strong> • Ochko: {score}
            </p>

            <div className="card" style={{ padding: 16, marginTop: 12, backgroundColor: "#f5f5f5" }}>
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
              <pre
                style={{
                  backgroundColor: "#1e1e1e",
                  color: "#00ff00",
                  padding: 12,
                  borderRadius: 4,
                  overflowX: "auto",
                }}
              >
                <code>{challenge.code}</code>
              </pre>
            </div>

            <div style={{ marginTop: 16 }}>
              <p>
                <strong>Javob:</strong>
              </p>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                placeholder="Javobni shu yerga yozing..."
                style={{
                  width: "100%",
                  padding: 8,
                  marginBottom: 12,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
              {feedback && (
                <p style={{ color: feedback.startsWith("✓") ? "green" : "red" }}>
                  {feedback}
                </p>
              )}
            </div>

            <div className="row">
              <button className="btn" onClick={checkAnswer}>
                Tekshirish
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h2>🎉 Barcha topshiriqlar tugadi!</h2>
            <p style={{ fontSize: 18 }}>Siz {score} ochko to'pladingiz!</p>
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <button
                className="btn"
                onClick={() => {
                  setIndex(0);
                  setAnswer("");
                  setScore(0);
                  setFinished(false);
                }}
              >
                Qayta boshlash
              </button>
              <Link className="btn btnGhost" href="/games/coding-puzzle">
                Orqaga
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
