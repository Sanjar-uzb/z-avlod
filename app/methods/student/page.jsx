"use client";

import Link from "next/link";
import {
  getProfile,
  requireProfile,
  saveStudentSurveyResult,
} from "@/lib/storage";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { regions } from "@/lib/regions";

const SCALE = [1, 2, 3, 4, 5];

const stageOneSections = [
  {
    key: "emotional_state",
    title: "I. Emosional holatni aniqlash",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang.",
    items: [
      "Men ko'pincha o'z his-tuyg'ularimni anglay olaman.",
      "Qiyin vaziyatlarda o'zimni bosiq tutishga harakat qilaman.",
      "Maktabda o'zimni psixologik jihatdan xavfsiz his qilaman.",
      "Men boshqalarning his-tuyg'ularini tushunishga harakat qilaman.",
    ],
  },

  {
    key: "social_activity",
    title: "II. Ijtimoiy faollikni aniqlash",
    description:
      "Quyidagi fikrlarga munosabatingizni belgilang.",
    items: [
      "Men jamoaviy ishlar va loyihalarda ishtirok etishni yoqtiraman.",
      "Sinfdoshlarim bilan hamkorlikda ishlash menga qulay.",
      "Maktabdagi tadbir va tashabbuslarda faol qatnashaman.",
      "Boshqalar fikrini inobatga olgan holda qaror qabul qilaman.",
    ],
  },
];

const stageTwoSections = [
  {
    key: "emotional_intelligence",
    title: "I. Emosional intellekt",
    maxScore: 25,

    items: [
      "Men o'z his-tuyg'ularimni oson anglay olaman.",
      "Qanday vaziyatda qanday his qilayotganimni aniq ifoda eta olaman.",
      "His-tuyg'ularimni boshqara olaman.",
      "Qiyin vaziyatlarda hissiyotlarimni boshqara olaman.",
      "Boshqalar bilan muloqotda his-tuyg'ularimni hisobga olaman.",
    ],
  },

  {
    key: "stress_resistance",
    title: "II. Stressga chidamlilik",
    maxScore: 25,

    items: [
      "Qiyinchiliklar meni tezda tushkunlikka tushirmaydi.",
      "Tanqidni xotirjam qabul qilaman.",
      "Stress paytida o'zimni qo'lga olaman.",
      "Muvaffaqiyatsizlikdan keyin tez tiklanaman.",
      "Bosim ostida ham qaror qabul qila olaman.",
    ],
  },
];

const stages = [
  {
    key: "stage1",
    shortTitle: "1-bosqich",
    title: "O'quvchi so'rovnomasi",
    sections: stageOneSections,
  },

  {
    key: "stage2",
    shortTitle: "2-bosqich",
    title: "Psixologik va pedagogik testlar",
    sections: stageTwoSections,
  },
];

function average(values) {
  if (!values.length) return 0;

  const total = values.reduce((sum, value) => sum + value, 0);

  return Number((total / values.length).toFixed(2));
}

function stageOneBand(avg) {
  if (avg >= 4.2) return "Yuqori";
  if (avg >= 3.2) return "Barqaror";
  if (avg >= 2.2) return "O'rtacha";

  return "Past";
}

function stageTwoBand(total) {
  if (total >= 21) return "Yuqori";
  if (total >= 16) return "O'rtadan yuqori";
  if (total >= 11) return "O'rta";

  return "Past";
}

function getStageStats(stageKey, sections, answers) {
  return sections.map((section) => {
    const values = section.items
      .map((_, idx) => answers[`${section.key}_${idx}`])
      .filter((value) => typeof value === "number");

    const avg = average(values);

    const total = values.reduce((sum, value) => sum + value, 0);

    let band = stageOneBand(avg);

    if (stageKey === "stage2") {
      band = stageTwoBand(total);
    }

    return {
      key: `${stageKey}_${section.key}`,
      title: section.title,
      avg,
      total,
      maxScore: section.items.length * 5,
      band,
    };
  });
}

function getFilledCount(sections, answers) {
  return sections.reduce((sum, section) => {
    return (
      sum +
      section.items.filter(
        (_, idx) =>
          typeof answers[`${section.key}_${idx}`] === "number"
      ).length
    );
  }, 0);
}

export default function StudentMethodsPage() {
  const router = useRouter();

  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [submittedStages, setSubmittedStages] = useState({});

  const [saved, setSaved] = useState(false);

  const [studentInfo, setStudentInfo] = useState({
    region: "",
    district: "",
    institution: "",
    grade: "",
    age: "",
    gender: "",
  });

  const [stageAnswers, setStageAnswers] = useState({
    stage1: {},
    stage2: {},
  });

  useEffect(() => {
    if (!requireProfile()) {
      router.push("/methods");
    }
  }, [router]);

  const currentStage = stages[currentStageIndex];

  const currentAnswers = stageAnswers[currentStage.key];

  const currentStats = useMemo(() => {
    return getStageStats(
      currentStage.key,
      currentStage.sections,
      currentAnswers
    );
  }, [currentAnswers, currentStage]);

  const currentFilledCount = useMemo(() => {
    return getFilledCount(
      currentStage.sections,
      currentAnswers
    );
  }, [currentAnswers, currentStage]);

  const currentTotalCount = useMemo(() => {
    return currentStage.sections.reduce(
      (sum, section) => sum + section.items.length,
      0
    );
  }, [currentStage]);

  const allStageStats = useMemo(() => {
    return stages.flatMap((stage) =>
      getStageStats(
        stage.key,
        stage.sections,
        stageAnswers[stage.key]
      )
    );
  }, [stageAnswers]);

  function updateStudentInfo(field, value) {
    setStudentInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
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

    if (currentStage.key === "stage2") {
      const profile = getProfile();

      const payload = {
        student: profile
          ? `${profile.firstName} ${profile.lastName}`
          : "",

        studentInfo,

        answers: stageAnswers,

        sectionStats: allStageStats,

        summary: {
          stage1: getStageStats(
            "stage1",
            stageOneSections,
            stageAnswers.stage1
          ),

          stage2: getStageStats(
            "stage2",
            stageTwoSections,
            stageAnswers.stage2
          ),
        },
      };

      saveStudentSurveyResult(payload);

      setSaved(true);
    }

    setSubmittedStages((prev) => ({
      ...prev,
      [currentStage.key]: true,
    }));
  }

  function nextStage() {
    setCurrentStageIndex((prev) =>
      Math.min(prev + 1, stages.length - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
        }}
      >
        <form onSubmit={showStageAnalysis}>
          <h1>{currentStage.title}</h1>

          {currentStage.key === "stage1" && (
            <section style={{ marginTop: 24 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 16,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span>Viloyat</span>

                  <select
                    className="input"
                    value={studentInfo.region}
                    onChange={(e) => {
                      updateStudentInfo("region", e.target.value);
                      updateStudentInfo("district", "");
                    }}
                    style={{
                      background: "#ffffff",
                      color: "#171717",
                      border: "1px solid #b8b0a0",
                    }}
                  >
                    <option value="">
                      Viloyatni tanlang
                    </option>

                    {Object.keys(regions).map((region) => (
                      <option
                        key={region}
                        value={region}
                      >
                        {region}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span>Tuman</span>

                  <select
                    className="input"
                    value={studentInfo.district}
                    onChange={(e) =>
                      updateStudentInfo("district", e.target.value)
                    }
                    disabled={!studentInfo.region}
                    style={{
                      background: "#ffffff",
                      color: "#171717",
                      border: "1px solid #b8b0a0",
                    }}
                  >
                    <option value="">
                      Tumanni tanlang
                    </option>

                    {studentInfo.region &&
                      regions[studentInfo.region].map(
                        (district) => (
                          <option
                            key={district}
                            value={district}
                          >
                            {district}
                          </option>
                        )
                      )}
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span>Ta'lim muassasasi</span>

                  <input
                    className="input"
                    value={studentInfo.institution}
                    onChange={(e) =>
                      updateStudentInfo(
                        "institution",
                        e.target.value
                      )
                    }
                    placeholder="Maktab nomi"
                    style={{
                      background: "#ffffff",
                      color: "#171717",
                      border: "1px solid #b8b0a0",
                      caretColor: "#171717",
                    }}

                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span>Sinf</span>

                  <input
                    className="input"
                    value={studentInfo.grade}
                    onChange={(e) =>
                      updateStudentInfo(
                        "grade",
                        e.target.value
                      )
                    }
                    placeholder="8-A"
                    style={{
                      background: "#ffffff",
                      color: "#171717",
                      border: "1px solid #b8b0a0",
                      caretColor: "#171717",
                    }}
                  />
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span>O'quvchi</span>

                  <div
                    style={{
                      background: "#f5f5f5",
                      border: "1px solid #d4d4d4",
                      borderRadius: 10,
                      padding: "12px 14px",
                      color: "#171717",
                      fontWeight: 600,
                    }}
                  >
                    {getProfile()?.lastName} {getProfile()?.firstName}
                  </div>
                </div>
              </div>
            </section>
          )}

          {currentStage.sections.map((section) => (
            <section
              key={section.key}
              style={{ marginTop: 32 }}
            >
              <h2>{section.title}</h2>

              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                {section.items.map((item, itemIndex) => {
                  const answerKey =
                    `${section.key}_${itemIndex}`;

                  return (
                    <div key={answerKey}>
                      <div
                        style={{
                          marginBottom: 12,
                          fontSize: 18,
                        }}
                      >
                        {item}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 14,
                        }}
                      >
                        {SCALE.map((option) => (
                          <label
                            key={option}
                            style={{
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <span>{option}</span>

                            <input
                              type="radio"
                              name={answerKey}
                              checked={
                                currentAnswers[
                                  answerKey
                                ] === option
                              }
                              onChange={() =>
                                updateAnswer(
                                  section.key,
                                  itemIndex,
                                  option
                                )
                              }
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

          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              background: "#f5f5f5",
            }}
          >
            To'ldirilgan:
            {" "}
            {currentFilledCount}
            {" / "}
            {currentTotalCount}
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {currentStageIndex < stages.length - 1 ? (
              <>
                <button
                  type="submit"
                  className="btn"
                >
                  Natijani ko'rsatish
                </button>

                {submittedStages[
                  currentStage.key
                ] && (
                  <button
                    type="button"
                    className="btn btnGhost"
                    onClick={nextStage}
                  >
                    Keyingi bosqich
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                className="btn"
              >
                Natijani ko'rish
              </button>
            )}
          </div>
        </form>

        {submittedStages[currentStage.key] && (
          <div style={{ marginTop: 32 }}>
            <h2>Yakuniy tahlil</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",
                gap: 16,
              }}
            >
              {currentStats.map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    {stat.title}
                  </div>

                  <div>
                    O'rtacha ball:
                    {" "}
                    <b>{stat.avg}</b>
                  </div>

                  <div>
                    Jami:
                    {" "}
                    <b>
                      {stat.total}/{stat.maxScore}
                    </b>
                  </div>

                  <div>
                    Holat:
                    {" "}
                    <b>{stat.band}</b>
                  </div>
                </div>
              ))}
            </div>

            {currentStage.key === "stage2" &&
              saved && (
                <div style={{ marginTop: 24 }}>
                  <p>
                    Natijalar saqlandi.
                  </p>

                  <Link
                    className="btn btnGhost"
                    href="/methods/student/results"
                  >
                    Tahlil sahifasi
                  </Link>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}