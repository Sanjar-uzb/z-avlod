"use client";

import Link from "next/link";
import { getProfile, requireProfile, saveStudentSurveyResult } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SCALE = [1, 2, 3, 4, 5];

const stageOneSections = [
  {
    key: "emotional_state",
    title: "II. Emosional holatni aniqlash",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang: (1 - mutlaqo qo'shilmayman, 5 - to'liq qo'shilaman).",
    items: [
      "Men ko'pincha o'z his-tuyg'ularimni anglay olaman.",
      "Qiyin vaziyatlarda o'zimni bosiq tutishga harakat qilaman.",
      "Maktabda o'zimni psixologik jihatdan xavfsiz his qilaman.",
      "Men boshqalarning his-tuyg'ularini tushunishga harakat qilaman.",
    ],
  },
  {
    key: "social_activity",
    title: "III. Ijtimoiy faollikni aniqlash",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang: (1 - mutlaqo qo'shilmayman, 5 - to'liq qo'shilaman).",
    items: [
      "Men jamoaviy ishlar va loyihalarda ishtirok etishni yoqtiraman.",
      "Sinfdoshlarim bilan hamkorlikda ishlash menga qulay.",
      "Maktabdagi tadbir va tashabbuslarda faol qatnashaman.",
      "Boshqalar fikrini inobatga olgan holda qaror qabul qilaman.",
    ],
  },
  {
    key: "digital_attitude",
    title: "IV. Raqamli muhitga munosabat",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang: (1 - mutlaqo qo'shilmayman, 5 - to'liq qo'shilaman).",
    items: [
      "Internet va ijtimoiy tarmoqlar hayotimning muhim qismi hisoblanadi.",
      "Internetdagi axborotni tanlab va tanqidiy baholab qabul qilaman.",
      "Onlayn muloqotda odob-axloq qoidalariga rioya qilishga harakat qilaman.",
      "Ijtimoiy tarmoqlardagi qiyoslash menga salbiy ta'sir qiladi.",
    ],
  },
  {
    key: "education_process",
    title: "V. Tarbiyaviy jarayonga munosabat",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang: (1 - mutlaqo qo'shilmayman, 5 - to'liq qo'shilaman).",
    items: [
      "Maktabda o'tkaziladigan tarbiyaviy mashg'ulotlar men uchun qiziqarli.",
      "Tarbiyaviy mashg'ulotlar hayotimda to'g'ri qaror qabul qilishga yordam beradi.",
      "O'qituvchi va tarbiyachilar mening fikrimni inobatga oladi.",
      "Tarbiyaviy jarayonda o'zimni faol ishtirokchi sifatida his qilaman.",
    ],
  },
  {
    key: "cognitive_state",
    title: "VI. Kognitiv holatni aniqlash",
    description:
      "Dars va o'quv faoliyati bilan bog'liq fikrlaringizni 1 dan 5 gacha baholang.",
    items: [
      "Dars paytida diqqatimni jamlay olaman.",
      "Yangi mavzuni tushunishda mustaqil fikr yurita olaman.",
      "O'quv topshiriqlarini bajarishda o'zimga ishonaman.",
      "Murakkab vazifalarni bosqichma-bosqich hal qila olaman.",
    ],
  },
];

const stageTwoSections = [
  {
    key: "emotional_intelligence",
    title: "I. Emosional intellektni baholash testi",
    description:
      "Ko'rsatma: Har bir savolni diqqat bilan o'qib chiqing va Sizga eng mos keladigan javobni belgilang. (1 - mutlaqo to'g'ri emas, 5 - to'liq to'g'ri)",
    maxScore: 25,
    items: [
      "Men o'z his-tuyg'ularimni oson anglay olaman.",
      "Qanday vaziyatda qanday his qilayotganimni aniq ifoda eta olaman.",
      "His-tuyg'ularim xulq-atvorimga salbiy ta'sir qilmasligiga harakat qilaman.",
      "Qiyin vaziyatlarda hissiyotlarimni boshqara olaman.",
      "Boshqalar bilan muloqotda his-tuyg'ularimni hisobga olaman.",
    ],
  },
  {
    key: "empathy_assessment",
    title: "II. Empatiyani baholash testi",
    maxScore: 25,
    items: [
      "Boshqalarning kayfiyatini tezda sezaman.",
      "Sinfdoshlarimning muammolariga befarq emasman.",
      "Kimdir xafa bo'lsa, unga yordam berishga harakat qilaman.",
      "Boshqalar nuqtai nazarini tushunishga harakat qilaman.",
      "Mojaroli vaziyatlarda murosa topishga intilaman.",
    ],
  },
  {
    key: "stress_resistance",
    title: "III. Stressga chidamlilikni baholash testi",
    maxScore: 25,
    items: [
      "Qiyinchiliklar meni tezda tushkunlikka tushirmaydi.",
      "Tanqidni xotirjam qabul qilaman.",
      "Stress paytida o'zimni qo'lga olaman.",
      "Muvaffaqiyatsizlikdan keyin o'zimga tez kela olaman.",
      "Bosim ostida ham to'g'ri qaror qabul qila olaman.",
    ],
  },
  {
    key: "social_adaptation",
    title: "IV. Ijtimoiy moslashuvni baholash testi",
    maxScore: 25,
    items: [
      "Yangi jamoaga tez moslasha olaman.",
      "Jamoada o'z o'rnimni topa olaman.",
      "Qoidalarga ongli ravishda rioya qilaman.",
      "Jamoaviy ishda mas'uliyatni his qilaman.",
      "Boshqalar bilan kelishmovchiliklarni tinch yo'l bilan hal qilaman.",
    ],
  },
];

const stageThreeSections = [
  {
    key: "behavior",
    title: "I. Xulq-atvor ko'rsatkichlari",
    items: [
      "Qoidalarga ongli ravishda rioya qiladi",
      "Mas'uliyatni his qiladi",
      "O'z xulq-atvorini nazorat qila oladi",
      "Mojaroli vaziyatlarda bosiqlikni saqlaydi",
    ],
  },
  {
    key: "teamwork",
    title: "II. Jamoada ishlash ko'rsatkichlari",
    items: [
      "Guruhli ishlarda faol ishtirok etadi",
      "Hamkorlikka tayyor",
      "Boshqalar fikrini inobatga oladi",
      "Jamoaviy qaror qabul qilishda ishtirok etadi",
    ],
  },
  {
    key: "communication",
    title: "III. Muloqot madaniyati ko'rsatkichlari",
    items: [
      "Fikrini ochiq va madaniy ifoda etadi",
      "Boshqalarni diqqat bilan tinglaydi",
      "Zo'ravonliksiz muloqot qoidalariga amal qiladi",
      "Tanqidni to'g'ri qabul qiladi",
    ],
  },
  {
    key: "social_engagement",
    title: "IV. Ijtimoiy faollik ko'rsatkichlari",
    items: [
      "Maktab tadbirlarida faol",
      "Tashabbus ko'rsatadi",
      "Jamoat ishlarida ishtirok etadi",
      "Ijtimoiy mas'uliyatni his qiladi",
    ],
  },
];

const stages = [
  {
    key: "stage1",
    shortTitle: "1-bosqich",
    title: "O'quvchi so'rovnomasi",
    intro:
      "Natijalar kognitiv, emosional va ijtimoiy ko'rsatkichlar bo'yicha tahlil qilinadi. Likert shkalasi asosida matematik-statistik ishlov beriladi.",
    sections: stageOneSections,
    showStudentInfo: true,
  },
  {
    key: "stage2",
    shortTitle: "2-bosqich",
    title: "Psixologik va pedagogik testlar to'plami",
    intro:
      "Z avlod o'quvchilarining shaxsiy va ijtimoiy rivojlanishini baholash uchun: emosional intellekt, empatiya, stressga chidamlilik va ijtimoiy moslashuv.",
    sections: stageTwoSections,
    evaluationNote:
      "V. Natijalarni baholash mezonlari: 21-25 ball - yuqori daraja, 16-20 ball - o'rtadan yuqori daraja, 11-15 ball - o'rta daraja, 10 va undan past - past daraja.",
  },
  {
    key: "stage3",
    shortTitle: "3-bosqich",
    title: "Pedagogik kuzatuv kartasi",
    intro:
      "Z avlod o'quvchilarining tarbiyaviy rivojlanish ko'rsatkichlarini baholash uchun: xulq-atvor, jamoada ishlash, muloqot madaniyati va ijtimoiy faollik.",
    sections: stageThreeSections,
    observationScale:
      "Baholash shkalasi: 1 - kuzatilmadi, 2 - kam darajada, 3 - o'rta darajada, 4 - yaxshi darajada, 5 - yuqori darajada.",
  },
];

function average(values) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function stageOneBand(avg) {
  if (avg >= 4.2) return "yuqori";
  if (avg >= 3.2) return "barqaror";
  if (avg >= 2.2) return "o'rtacha";
  return "e'tibor talab qiladi";
}

function stageTwoBand(total) {
  if (total >= 21) return "yuqori daraja";
  if (total >= 16) return "o'rtadan yuqori daraja";
  if (total >= 11) return "o'rta daraja";
  return "past daraja";
}

function stageThreeBand(avg) {
  if (avg >= 4.2) return "yuqori";
  if (avg >= 3.2) return "yaxshi";
  if (avg >= 2.2) return "o'rta";
  return "past";
}

function getStageStats(stageKey, sections, answers) {
  return sections.map((section) => {
    const values = section.items
      .map((_, idx) => answers[`${section.key}_${idx}`])
      .filter((value) => typeof value === "number");
    const avg = average(values);
    const total = values.reduce((sum, value) => sum + value, 0);

    let band = stageOneBand(avg);
    if (stageKey === "stage2") band = stageTwoBand(total);
    if (stageKey === "stage3") band = stageThreeBand(avg);

    return {
      key: `${stageKey}_${section.key}`,
      title: section.title,
      avg,
      total,
      count: values.length,
      maxScore: section.items.length * 5,
      band,
    };
  });
}

function getFilledCount(sections, answers) {
  return sections.reduce((sum, section) => {
    return sum + section.items.filter((_, idx) => typeof answers[`${section.key}_${idx}`] === "number").length;
  }, 0);
}

function getObservationClassName(studentInfo, observationInfo, profile) {
  return studentInfo.grade.trim() || observationInfo.grade.trim() || profile?.org || "Noma'lum";
}

export default function StudentMethodsPage() {
  const router = useRouter();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [submittedStages, setSubmittedStages] = useState({});
  const [saved, setSaved] = useState(false);

  const [studentInfo, setStudentInfo] = useState({
    grade: "",
    age: "",
    gender: "",
  });

  const [observationInfo, setObservationInfo] = useState({
    institution: "",
    grade: "",
    date: "",
    observer: "",
    forms: [],
    conclusionLevel: "",
    conclusionText: "",
  });

  const [stageAnswers, setStageAnswers] = useState({
    stage1: {},
    stage2: {},
    stage3: {},
  });

  useEffect(() => {
    if (!requireProfile()) router.push("/methods");
  }, [router]);

  useEffect(() => {
    const profile = getProfile();
    if (!profile) return;
    setStudentInfo((prev) => ({
      ...prev,
      grade: prev.grade || profile.org || "",
    }));
    setObservationInfo((prev) => ({
      ...prev,
      grade: prev.grade || profile.org || "",
    }));
  }, []);

  const currentStage = stages[currentStageIndex];
  const currentAnswers = stageAnswers[currentStage.key];
  const currentStats = useMemo(
    () => getStageStats(currentStage.key, currentStage.sections, currentAnswers),
    [currentAnswers, currentStage]
  );
  const currentFilledCount = useMemo(
    () => getFilledCount(currentStage.sections, currentAnswers),
    [currentAnswers, currentStage]
  );
  const currentTotalCount = useMemo(
    () => currentStage.sections.reduce((sum, section) => sum + section.items.length, 0),
    [currentStage]
  );

  const allStageStats = useMemo(() => {
    return stages.flatMap((stage) =>
      getStageStats(stage.key, stage.sections, stageAnswers[stage.key])
    );
  }, [stageAnswers]);

  function updateStudentInfo(field, value) {
    setStudentInfo((prev) => ({ ...prev, [field]: value }));
  }

  function updateObservationInfo(field, value) {
    setObservationInfo((prev) => ({ ...prev, [field]: value }));
  }

  function toggleObservationForm(value) {
    setObservationInfo((prev) => {
      const exists = prev.forms.includes(value);
      return {
        ...prev,
        forms: exists ? prev.forms.filter((item) => item !== value) : [...prev.forms, value],
      };
    });
  }

  function updateAnswer(sectionKey, itemIndex, value) {
    setStageAnswers((prev) => ({
      ...prev,
      [currentStage.key]: {
        ...prev[currentStage.key],
        [`${sectionKey}_${itemIndex}`]: value,
      },
    }));
  }

  function showStageAnalysis(event) {
    event.preventDefault();

    if (currentStage.key === "stage3") {
      const profile = getProfile();
      const className = getObservationClassName(studentInfo, observationInfo, profile);
      const payload = {
        student: profile ? `${profile.firstName} ${profile.lastName}` : "",
        org: profile?.org || "",
        className,
        studentInfo,
        observationInfo,
        answers: stageAnswers,
        answeredCount: stages.reduce(
          (sum, stage) => sum + getFilledCount(stage.sections, stageAnswers[stage.key]),
          0
        ),
        totalStatements: stages.reduce(
          (sum, stage) => sum + stage.sections.reduce((acc, section) => acc + section.items.length, 0),
          0
        ),
        sectionStats: allStageStats,
        summary: {
          stage1: getStageStats("stage1", stageOneSections, stageAnswers.stage1),
          stage2: getStageStats("stage2", stageTwoSections, stageAnswers.stage2),
          stage3: getStageStats("stage3", stageThreeSections, stageAnswers.stage3),
          conclusionLevel: observationInfo.conclusionLevel,
          conclusionText: observationInfo.conclusionText,
        },
      };

      saveStudentSurveyResult(payload);
      setSaved(true);
    }

    setSubmittedStages((prev) => ({ ...prev, [currentStage.key]: true }));
  }

  function nextStage() {
    setCurrentStageIndex((prev) => Math.min(prev + 1, stages.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="container" style={{ paddingBottom: 36 }}>
      <div
        className="card"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          background: "#fffdf8",
          color: "#171717",
          border: "1px solid #d6d0c4",
          boxShadow: "0 24px 70px rgba(0,0,0,.28)",
        }}
      >
        <form onSubmit={showStageAnalysis}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#ece5d7",
                  border: "1px solid #d3c7b1",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {currentStage.shortTitle} / {stages.length}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.2,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                {currentStage.title}
              </h1>
              <p style={{ margin: "10px 0 0", maxWidth: 680, lineHeight: 1.8 }}>
                {currentStage.intro}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <Link
                className="btn btnGhost"
                href="/methods"
                style={{ background: "#f3efe7", color: "#1d1d1d", borderColor: "#cfc6b4" }}
              >
                Orqaga
              </Link>
            </div>
          </div>

          {currentStage.key === "stage1" && (
            <section
              style={{
                marginTop: 20,
                borderTop: "2px solid #1b1b1b",
                paddingTop: 18,
              }}
            >
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                I. Umumiy ma'lumotlar
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 18, fontFamily: "Georgia, 'Times New Roman', serif" }}>Sinfingiz:</span>
                  <input
                    className="input"
                    value={studentInfo.grade}
                    onChange={(e) => updateStudentInfo("grade", e.target.value)}
                    placeholder="Masalan: 8-A"
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 18, fontFamily: "Georgia, 'Times New Roman', serif" }}>Yoshingiz:</span>
                  <input
                    className="input"
                    value={studentInfo.age}
                    onChange={(e) => updateStudentInfo("age", e.target.value)}
                    placeholder="Masalan: 14"
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 18, marginBottom: 8, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Jinsingiz:
                </div>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  {["Qiz", "O'g'il"].map((gender) => (
                    <label key={gender} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="radio"
                        name="gender"
                        checked={studentInfo.gender === gender}
                        onChange={() => updateStudentInfo("gender", gender)}
                      />
                      <span>{gender}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {currentStage.key === "stage3" && (
            <section
              style={{
                marginTop: 20,
                borderTop: "2px solid #1b1b1b",
                paddingTop: 18,
              }}
            >
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Kuzatuv ma'lumotlari
              </div>

              <p style={{ margin: "0 0 12px", lineHeight: 1.8 }}>{currentStage.observationScale}</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span>Ta'lim muassasasi</span>
                  <input
                    className="input"
                    value={observationInfo.institution}
                    onChange={(e) => updateObservationInfo("institution", e.target.value)}
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span>Sinf</span>
                  <input
                    className="input"
                    value={observationInfo.grade}
                    onChange={(e) => updateObservationInfo("grade", e.target.value)}
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span>Sana</span>
                  <input
                    type="date"
                    className="input"
                    value={observationInfo.date}
                    onChange={(e) => updateObservationInfo("date", e.target.value)}
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span>Kuzatuvchi pedagog</span>
                  <input
                    className="input"
                    value={observationInfo.observer}
                    onChange={(e) => updateObservationInfo("observer", e.target.value)}
                    style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0" }}
                  />
                </label>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Kuzatuv shakli</div>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  {["Dars", "Tarbiyaviy mashg'ulot", "Loyiha", "Tadbir"].map((item) => (
                    <label key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={observationInfo.forms.includes(item)}
                        onChange={() => toggleObservationForm(item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {currentStage.sections.map((section) => (
            <section key={section.key} style={{ marginTop: 28 }}>
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {section.title}
              </div>

              {section.description && (
                <p style={{ margin: "0 0 14px", lineHeight: 1.8 }}>
                  {section.description}
                </p>
              )}

              <div style={{ display: "grid", gap: 18 }}>
                {section.items.map((item, itemIndex) => {
                  const answerKey = `${section.key}_${itemIndex}`;

                  return (
                    <div
                      key={answerKey}
                      style={{
                        borderBottom: "1px dashed #cfc6b4",
                        paddingBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          lineHeight: 1.65,
                          marginBottom: 10,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                        }}
                      >
                        {currentStage.key === "stage3" ? (
                          <span>
                            {itemIndex + 1}. {item}
                          </span>
                        ) : (
                          item
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {SCALE.map((option) => (
                          <label
                            key={option}
                            style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 42 }}
                          >
                            <span>{option}</span>
                            <input
                              type="radio"
                              name={answerKey}
                              checked={currentAnswers[answerKey] === option}
                              onChange={() => updateAnswer(section.key, itemIndex, option)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {currentStage.key === "stage2" && (
            <div
              style={{
                marginTop: 28,
                padding: 18,
                borderRadius: 18,
                background: "#f6f1e7",
                border: "1px solid #d8cfbe",
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Baholash mezonlari</div>
              {currentStage.evaluationNote}
            </div>
          )}

          {currentStage.key === "stage3" && (
            <section
              style={{
                marginTop: 28,
                padding: 18,
                borderRadius: 18,
                background: "#f6f1e7",
                border: "1px solid #d8cfbe",
              }}
            >
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Umumiy xulosa (pedagog uchun)
              </div>

              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
                {["Yuqori", "O'rta", "Past"].map((level) => (
                  <label key={level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="radio"
                      name="conclusionLevel"
                      checked={observationInfo.conclusionLevel === level}
                      onChange={() => updateObservationInfo("conclusionLevel", level)}
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span>Qisqacha pedagogik tavsif</span>
                <textarea
                  className="input"
                  rows={5}
                  value={observationInfo.conclusionText}
                  onChange={(e) => updateObservationInfo("conclusionText", e.target.value)}
                  style={{ background: "#fff", color: "#171717", borderColor: "#b8b0a0", resize: "vertical" }}
                />
              </label>
            </section>
          )}

          <div
            style={{
              marginTop: 28,
              padding: 18,
              borderRadius: 18,
              background: "#f6f1e7",
              border: "1px solid #d8cfbe",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Joriy holat</div>
            <p style={{ margin: 0, lineHeight: 1.8 }}>
              To'ldirilgan bandlar: {currentFilledCount} / {currentTotalCount}
            </p>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn"
              style={{ background: "#1f3b73", borderColor: "#1f3b73" }}
            >
              Natijani ko'rsatish
            </button>

            {submittedStages[currentStage.key] && currentStageIndex < stages.length - 1 && (
              <button
                type="button"
                className="btn btnGhost"
                onClick={nextStage}
                style={{ background: "#f3efe7", color: "#1d1d1d", borderColor: "#cfc6b4" }}
              >
                Keyingi bosqichga o'tish
              </button>
            )}
          </div>
        </form>

        {submittedStages[currentStage.key] && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #d6cdbf",
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Yakuniy tahlil
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {currentStats.map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    border: "1px solid #d6cdbf",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{stat.title.replace(/^[IVX]+\.\s*/, "")}</div>
                  <div>O'rtacha ball: <b>{stat.avg}</b></div>
                  <div>Jami ball: <b>{stat.total}/{stat.maxScore}</b></div>
                  <div>Holat: <b>{stat.band}</b></div>
                </div>
              ))}
            </div>

            {currentStage.key === "stage3" && saved && (
              <>
                <p style={{ margin: "14px 0 0", color: "#355d2f", lineHeight: 1.8 }}>
                  Yakuniy natija saqlandi. Endi ma'lumotlar sinf bo'yicha umumiy tahlil sahifasida ko'rinadi.
                </p>

                <div className="row" style={{ marginTop: 14 }}>
                  <Link
                    className="btn btnGhost"
                    href="/methods/student/results"
                    style={{ background: "#f3efe7", color: "#1d1d1d", borderColor: "#cfc6b4" }}
                  >
                    Tahlil sahifasiga o'tish
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
