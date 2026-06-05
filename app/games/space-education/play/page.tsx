"use client";

import { useState } from "react";
import Link from "next/link";

const SPACE_FACTS = [
  {
    question: "Qaysi sayyora Quyosh dan eng uzoqda?",
    options: ["Neptun", "Pluton", "Uran", "Saturn"],
    answer: "Neptun",
    fact: "Neptun Quyoshdan ~4.5 milliard km uzoqda.",
  },
  {
    question: "Oy Yer atrofida necha kun ichida aylanadi?",
    options: ["27.3 kun", "29.5 kun", "24 soat", "365 kun"],
    answer: "27.3 kun",
    fact: "Oy Yer atrofida taxminan 27.3 kunda bir marta aylanadi (sidereal).",
  },
  {
    question: "Qaysi sayyora 'Qizil sayyora' deb nomlanadi?",
    options: ["Venus", "Mars", "Zemlya", "Merkuriy"],
    answer: "Mars",
    fact: "Mars sirtidagi temir oksidlari tufayli qizil rangda ko'rinadi.",
  },
  {
    question: "Quyosh hozirgi vaqtda taxminan nechchi yoshda?",
    options: ["4.6 milliard yil", "1 million yil", "10 milliard yil", "100 million yil"],
    answer: "4.6 milliard yil",
    fact: "Quyosh taxminan 4.6 milliard yoshda.",
  },
  {
    question: "Yerdagi gravitatsiya kuchi nimaga bog'liq?",
    options: ["Massa va masofaga", "Faqat massa", "Faqat tezlik", "Faqat hajm"],
    answer: "Massa va masofaga",
    fact: "Gravitatsiya kuchi jismlarning massasi va ular orasidagi masofaga bog'liq.",
  },
  {
    question: "Sayyoralar qanday joylarda hosil bo‘ladi?",
    options: ["Yulduzlar atrofida", "Galaktika markazida", "Chuqurlikdagi bulutlarda", "Kosmonavt stansiyasida"],
    answer: "Yulduzlar atrofida",
    fact: "Planetalarning ko'pi yulduz atrofidagi gaz va tosh disklaridan hosil bo'ladi.",
  },
  {
    question: "Quyosh tizimidagi eng katta sayyora qaysi?",
    options: ["Yupiter", "Saturn", "Uran", "Neptun"],
    answer: "Yupiter",
    fact: "Yupiter Quyosh tizimidagi eng katta sayyora hisoblanadi.",
  },
  {
    question: "Yulduz qanday hosil bo'ladi?",
    options: ["Gaz bulutlari siqilganda", "Kosmos to'lqinlari bilan", "Meteorlar to'planganda", "Oy sinishi bilan"],
    answer: "Gaz bulutlari siqilganda",
    fact: "Yulduzlar katta gaz bulutlari (nebula) gravitatsion siqilish natijasida hosil bo'ladi.",
  },
  {
    question: "Orbit nima?",
    options: ["Obyektning aylanish yo'li", "Yulduz yorug'ligi", "Atmosfera turi", "Radio signal"],
    answer: "Obyektning aylanish yo'li",
    fact: "Orbit — sayyora yoki sun'iy obyektning boshqa jismlar atrofida aylanish yo'lidir.",
  },
  {
    question: "Teleskop nima uchun ishlatiladi?",
    options: ["Yaqin obyektlarni ko'rish", "Kosmosni kuzatish va yoritilgan jismlarni ko'rish", "Su yuzasini o'rganish", "Yer osti qazilmalarni topish"],
    answer: "Kosmosni kuzatish va yoritilgan jismlarni ko'rish",
    fact: "Teleskop yulduzlar, sayyoralar va boshqa kosmik jismlarni yaqinroq va aniqroq ko'rishga yordam beradi.",
  },
];

export default function SpaceEducationPlay() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  function answer(option: string) {
    if (showResult) return;
    setSelected(option);
    const isCorrect = option === SPACE_FACTS[index].answer;
    if (isCorrect) setScore(score + 10);
    setShowResult(true);
    setTimeout(() => nextQuestion(), 1500);
  }

  function nextQuestion() {
    const next = index + 1;
    if (next >= SPACE_FACTS.length) {
      setFinished(true);
    } else {
      setIndex(next);
      setSelected(null);
      setShowResult(false);
    }
  }

  const fact = SPACE_FACTS[index];

  return (
    <div className="container">
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>Space Education Game</h1>
          <Link className="btn btnGhost" href="/games/space-education">
            Orqaga
          </Link>
        </div>

        {!finished ? (
          <>
            <p>
              <strong>Savol {index + 1}/{SPACE_FACTS.length}</strong> • Ochko: {score}
            </p>

            <div className="card" style={{ padding: 16, marginTop: 12, backgroundColor: "#1a1a2e" }}>
              <p style={{ color: "#fff", fontSize: 18, marginBottom: 16 }}>
                🌌 {fact.question}
              </p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {fact.options.map((opt) => {
                  const isCorrect = opt === fact.answer;
                  const isSelected = selected === opt;
                  const btnClass = showResult
                    ? isCorrect
                      ? "btn btnSuccess"
                      : isSelected
                      ? "btn btnDanger"
                      : "btn"
                    : "btn";
                  return (
                    <button
                      key={opt}
                      className={btnClass}
                      onClick={() => answer(opt)}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <p style={{ color: "#fff", marginTop: 12, fontSize: 14 }}>
                  💡 {fact.fact}
                </p>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h2>🚀 Kosmos o'rganish tugadi!</h2>
            <p style={{ fontSize: 18 }}>Siz {score} ochko to'pladingiz!</p>
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <button
                className="btn"
                onClick={() => {
                  setIndex(0);
                  setScore(0);
                  setSelected(null);
                  setShowResult(false);
                  setFinished(false);
                }}
              >
                Qayta boshlash
              </button>
              <Link className="btn btnGhost" href="/games/space-education">
                Orqaga
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
