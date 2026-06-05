"use client";

import Link from "next/link";
import { getStudentSurveyResults, requireProfile } from "@/lib/storage";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAs } from "file-saver";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("uz-UZ");
  } catch {
    return "";
  }
}

function getClassName(result) {
  return result.className || result.studentInfo?.grade || result.org || "Noma'lum";
}

function getSectionLabel(stat) {
  return stat.title.replace(/^[IVX]+\.\s*/, "");
}

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function StudentSurveyResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [selectedClass, setSelectedClass] = useState("Barchasi");

  useEffect(() => {
    if (!requireProfile()) {
      router.push("/methods");
      return;
    }

    setResults(getStudentSurveyResults());
  }, [router]);

  const latest = useMemo(() => results[0] || null, [results]);

  const sectionKeys = useMemo(() => {
    const keys = new Map();
    results.forEach((item) => {
      item.sectionStats?.forEach((stat) => {
        if (!keys.has(stat.key)) {
          keys.set(stat.key, getSectionLabel(stat));
        }
      });
    });
    return Array.from(keys.entries()).map(([key, label]) => ({ key, label }));
  }, [results]);

  const groupedByClass = useMemo(() => {
    const groups = new Map();

    results.forEach((item) => {
      const className = getClassName(item);
      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className).push(item);
    });

    return Array.from(groups.entries())
      .map(([className, items]) => {
        const sectionAverages = sectionKeys.map((section) => {
          const values = items
            .map((item) => item.sectionStats?.find((stat) => stat.key === section.key)?.avg || 0)
            .filter((value) => value > 0);

          const avg = values.length
            ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
            : 0;

          return {
            key: section.key,
            label: section.label,
            avg,
          };
        });

        return {
          className,
          items,
          sectionAverages,
        };
      })
      .sort((a, b) => a.className.localeCompare(b.className, "uz"));
  }, [results, sectionKeys]);

  const classOptions = useMemo(() => {
    return ["Barchasi", ...groupedByClass.map((group) => group.className)];
  }, [groupedByClass]);

  const visibleGroups = useMemo(() => {
    if (selectedClass === "Barchasi") return groupedByClass;
    return groupedByClass.filter((group) => group.className === selectedClass);
  }, [groupedByClass, selectedClass]);

  function exportToExcelCsv() {
    if (!results.length) return;

    const header = [
      "Sana",
      "O'quvchi",
      "Sinf",
      "Yosh",
      "Jins",
      "Javoblar",
      ...sectionKeys.map((section) => `${section.label} o'rtacha ball`),
      ...sectionKeys.map((section) => `${section.label} holat`),
    ];

    const rows = results.map((item) => {
      const statMap = new Map((item.sectionStats || []).map((stat) => [stat.key, stat]));
      return [
        formatDate(item.savedAt),
        item.student || "",
        getClassName(item),
        item.studentInfo?.age || "",
        item.studentInfo?.gender || "",
        `${item.answeredCount}/${item.totalStatements}`,
        ...sectionKeys.map((section) => statMap.get(section.key)?.avg ?? ""),
        ...sectionKeys.map((section) => statMap.get(section.key)?.band ?? ""),
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "student-survey-results.csv");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="h2">So'rovnoma tahlillari</div>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
              Bu sahifada o'quvchi so'rovnomasi natijalari sinf bo'yicha saqlanadi,
              diagramma orqali ko'rsatiladi va Excel uchun eksport qilinadi.
            </p>
          </div>

          <div className="row">
            <button className="btn" onClick={exportToExcelCsv} disabled={!results.length}>
              Excel ga eksport
            </button>
            <Link className="btn btnGhost" href="/methods/student">So'rovnomaga qaytish</Link>
            <Link className="btn btnGhost" href="/methods">Metodlar</Link>
          </div>
        </div>
      </div>

      {latest && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="h3">So'nggi natija</div>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">O'quvchi: {latest.student || "Noma'lum"}</span>
            <span className="badge">Sinf: {getClassName(latest)}</span>
            <span className="badge">Javoblar: {latest.answeredCount}/{latest.totalStatements}</span>
            <span className="badge">Sana: {formatDate(latest.savedAt)}</span>
          </div>

          <div className="grid" style={{ marginTop: 14 }}>
            {latest.sectionStats?.map((stat) => (
              <div key={stat.key} className="card" style={{ gridColumn: "span 4" }}>
                <div className="itemTitle">{getSectionLabel(stat)}</div>
                <div className="muted">O'rtacha ball: {stat.avg}</div>
                <div className="muted">Holat: {stat.band}</div>
                <div className="muted">Javoblar: {stat.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="h3" style={{ marginBottom: 0 }}>Sinf bo'yicha diagrammalar</div>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="muted">Filtr:</span>
            <select
              className="input"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: 180 }}
            >
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visibleGroups.length === 0 ? (
          <p className="muted" style={{ marginTop: 10 }}>
            Hali saqlangan so'rovnoma natijasi yo'q.
          </p>
        ) : (
          <div className="list" style={{ marginTop: 12 }}>
            {visibleGroups.map((group) => {
              const chartData = {
                labels: group.sectionAverages.map((item) => item.label),
                datasets: [
                  {
                    label: `${group.className} sinfi o'rtacha ko'rsatkichi`,
                    data: group.sectionAverages.map((item) => item.avg),
                    backgroundColor: [
                      "rgba(37, 99, 235, 0.75)",
                      "rgba(5, 150, 105, 0.75)",
                      "rgba(217, 119, 6, 0.75)",
                      "rgba(220, 38, 38, 0.75)",
                      "rgba(124, 58, 237, 0.75)",
                    ],
                    borderRadius: 10,
                  },
                ],
              };

              return (
                <div key={group.className} className="card">
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="itemTitle">{group.className} sinfi</div>
                    <div className="row">
                      <span className="badge">Natijalar soni: {group.items.length}</span>
                      <span className="badge">Saqlash limiti: 100</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, background: "rgba(255,255,255,.03)", borderRadius: 18, padding: 12 }}>
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: { stepSize: 1 },
                          },
                        },
                      }}
                      height={260}
                    />
                  </div>

                  <div className="grid" style={{ marginTop: 14 }}>
                    {group.sectionAverages.map((item) => (
                      <div key={item.key} className="card" style={{ gridColumn: "span 4" }}>
                        <div className="itemTitle">{item.label}</div>
                        <div className="muted">Sinf bo'yicha o'rtacha: {item.avg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
