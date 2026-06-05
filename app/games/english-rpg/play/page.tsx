"use client";

import { useState } from "react";
import Link from "next/link";

const DIALOGUES = [
  { id: 1, character: "Tom", english: "Hello, my name is Tom. What is your name?", uzbek: "Assalomu alaykum, mening ismim Tom. Sizning ismingiz nima?", options: [{ text: "My name is Ali", uzbText: "Mening ismim Ali" }, { text: "Nice to meet you", uzbText: "Sizga tanishib tuyuldi" }] },
  { id: 2, character: "Sarah", english: "How are you today?", uzbek: "Bugun qanday? Yaxshi ekanmisiz?", options: [{ text: "I am fine, thank you", uzbText: "Men yaxshi-man, rahmat" }, { text: "I am tired", uzbText: "Men charchadim" }] },
  { id: 3, character: "Mike", english: "Where are you from?", uzbek: "Siz qayerdan?", options: [{ text: "I am from Uzbekistan", uzbText: "Men O'zbekistondanman" }, { text: "I am from London", uzbText: "Men Londondanman" }] },
  { id: 4, character: "Emma", english: "Do you like programming?", uzbek: "Siz dasturlashni yoqtiradi ekanmisiz?", options: [{ text: "Yes, I love it!", uzbText: "Ha, men uni sevaman!" }, { text: "No, I prefer art", uzbText: "Yo'q, men san'atni afzal ko'raman" }] },
  { id: 5, character: "Alex", english: "What's your favorite hobby?", uzbek: "Sizning sevimli mashg'ulotingiz nima?", options: [{ text: "I like reading", uzbText: "Men o'qishni yaxshi ko'raman" }, { text: "I play football", uzbText: "Men futbol o'ynayman" }] },
  { id: 6, character: "Lily", english: "Can you help me with homework?", uzbek: "Uy vazifamda yordam bera olasizmi?", options: [{ text: "Sure, let's try", uzbText: "Albatta, urinib ko'ramiz" }, { text: "Sorry, I'm busy", uzbText: "Kechirasiz, bandman" }] },
  { id: 7, character: "Sam", english: "What time is it?", uzbek: "Hozir soat nechchi?", options: [{ text: "It's eight o'clock", uzbText: "Soat sakkiz" }, { text: "It's half past six", uzbText: "Soat olti yarim" }] },
  { id: 8, character: "Nina", english: "Do you want tea or coffee?", uzbek: "Choymi yoki qahvami xohlaysiz?", options: [{ text: "Tea, please", uzbText: "Iltimos, choy" }, { text: "Coffee, thanks", uzbText: "Rahmat, qahva" }] },
  { id: 9, character: "Ben", english: "How do you go to school?", uzbek: "Siz maktabga qanday borasiz?", options: [{ text: "By bus", uzbText: "Avtobus bilan" }, { text: "By car", uzbText: "Mashina bilan" }] },
  { id: 10, character: "Maya", english: "What's your favorite food?", uzbek: "Sizning sevimli ovqatingiz nima?", options: [{ text: "I like pizza", uzbText: "Menga pizza yoqadi" }, { text: "I like salad", uzbText: "Menga salat yoqadi" }] },
  { id: 11, character: "Omar", english: "Can you speak English well?", uzbek: "Siz ingliz tilida yaxshi gapirasizmi?", options: [{ text: "A little", uzbText: "Biroz" }, { text: "Very well", uzbText: "Yaxshi" }] },
  { id: 12, character: "Zara", english: "What is your favorite subject?", uzbek: "Sizning sevimli faningiz qaysi?", options: [{ text: "Math", uzbText: "Matematika" }, { text: "Art", uzbText: "San'at" }] },
  { id: 13, character: "Ibrahim", english: "Where did you go last weekend?", uzbek: "Siz o'tgan dam olish kunlari qayerga bordingiz?", options: [{ text: "To the park", uzbText: "Parkga" }, { text: "Stayed home", uzbText: "Uyda qoldim" }] },
  { id: 14, character: "Hana", english: "Do you prefer summer or winter?", uzbek: "Siz yozni yoki qishni afzal ko'rasiz?", options: [{ text: "Summer", uzbText: "Yoz" }, { text: "Winter", uzbText: "Qish" }] },
  { id: 15, character: "Ryan", english: "How do you feel today?", uzbek: "Bugun o'zingizni qanday his qilasiz?", options: [{ text: "Happy", uzbText: "Baxtli" }, { text: "A bit nervous", uzbText: "Biroz xavotirdaman" }] },
  { id: 16, character: "Sara", english: "What are your plans for holidays?", uzbek: "Bayramlarda rejalar qanday?", options: [{ text: "Travel abroad", uzbText: "Chetdan sayohat" }, { text: "Visit family", uzbText: "Oila ziyorat" }] },
  { id: 17, character: "Leo", english: "How often do you exercise?", uzbek: "Siz qancha tez-tez mashq qilasiz?", options: [{ text: "Every day", uzbText: "Har kuni" }, { text: "Sometimes", uzbText: "Ba'zan" }] },
  { id: 18, character: "Tina", english: "What music do you like?", uzbek: "Qanday musiqani yoqtirasiz?", options: [{ text: "Pop", uzbText: "Pop" }, { text: "Classical", uzbText: "Klassik" }] },
  { id: 19, character: "Ethan", english: "Can you recommend a book?", uzbek: "Kitob tavsiya qila olasizmi?", options: [{ text: "Yes, try 'The Little Prince'", uzbText: "Ha, 'Kichik malik'ni o'qishni tavsiya qilaman" }, { text: "No, I don't read much", uzbText: "Yo'q, men kam o'qiyman" }] },
  { id: 20, character: "Olga", english: "Will you join our club?", uzbek: "Siz klubimizga qo'shilasizmi?", options: [{ text: "Yes, I'd love to", uzbText: "Ha, mamnuniyat bilan" }, { text: "Maybe later", uzbText: "Keyinroq" }] },
];

export default function EnglishRpgPlay() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function answer(points: number) {
    setScore(score + points);
    const next = index + 1;
    if (next >= DIALOGUES.length) {
      setFinished(true);
    } else {
      setIndex(next);
    }
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setFinished(false);
  }

  const dialog = DIALOGUES[index];

  return (
    <div className="container">
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>English RPG Game</h1>
          <Link className="btn btnGhost" href="/games/english-rpg">
            Orqaga
          </Link>
        </div>

        {!finished ? (
          <>
            <p>
              <strong>Savol {index + 1}/{DIALOGUES.length}</strong> • Ochko: {score}
            </p>

            <div className="card" style={{ padding: 16, marginTop: 12, backgroundColor: "#e3f2fd" }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>
                <strong>🗣️ {dialog.character}:</strong>
              </p>
              <p style={{ fontSize: 16, fontStyle: "italic" }}>{dialog.english}</p>
              <p style={{ fontSize: 14, color: "#666" }}>({dialog.uzbek})</p>
            </div>

            <div style={{ marginTop: 16 }}>
              {dialog.options.map((opt, i) => (
                <button
                  key={i}
                  className="btn"
                  style={{ display: "block", width: "100%", marginBottom: 8, textAlign: "left" }}
                  onClick={() => answer(10)}
                >
                  ✓ {opt.text} ({opt.uzbText})
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h2>🎉 Dars tugadi!</h2>
            <p style={{ fontSize: 20 }}>Siz {score} ochko to'pladingiz!</p>
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <button className="btn" onClick={restart}>
                Qayta boshlash
              </button>
              <Link className="btn btnGhost" href="/games/english-rpg">
                Orqaga
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
