"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import labs from "@/data/labs.json";

type LabItem = {
  fan: string;
  lab: string;
  title: string;
  desc: string;
};

const FAN_ORDER = ["fizika", "kimyo", "biologiya", "informatika"];

const FAN_META: Record<string, { label: string; accent: string; gradient: string; description: string }> = {
  fizika: {
    label: "Fizika",
    accent: "#0ea5e9",
    gradient: "linear-gradient(135deg, rgba(14,165,233,0.92), rgba(15,23,42,0.16))",
    description: "Harakat, kuch va energiya laboratoriyalari.",
  },
  kimyo: {
    label: "Kimyo",
    accent: "#a855f7",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.92), rgba(15,23,42,0.16))",
    description: "Kislota, modda va tajriba laboratoriyalari.",
  },
  biologiya: {
    label: "Biologiya",
    accent: "#22c55e",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.92), rgba(15,23,42,0.16))",
    description: "Organizm va hayot fanlari laboratoriyalari.",
  },
  informatika: {
    label: "Informatika",
    accent: "#38bdf8",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.92), rgba(15,23,42,0.16))",
    description: "Kod yozish va algoritm laboratoriyalari.",
  },
};

export default function LabsIndexClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const labItems = labs as LabItem[];
  const fanFromQuery = searchParams.get("fan") || "";
  const [selectedFan, setSelectedFan] = React.useState<string>(fanFromQuery && FAN_ORDER.includes(fanFromQuery) ? fanFromQuery : "");

  React.useEffect(() => {
    const f = searchParams.get("fan") || "";
    if (f && FAN_ORDER.includes(f)) setSelectedFan(f);
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    if (!selectedFan) return [];
    return labItems.filter((x) => x.fan === selectedFan);
  }, [selectedFan, labItems]);

  function handleFanSelect(fan: string) {
    const url = `/labs?fan=${encodeURIComponent(fan)}`;
    
    setSelectedFan(fan);
    router.push(url);
  }

  function handleBack() {
    if (selectedFan) {
      setSelectedFan("");
      router.replace(`/labs`);
    } else {
      router.back();
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ padding: 24, overflow: "hidden" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="h2">3D laboratoriyalar</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Fizika, Kimyo, Biologiya va Informatika laboratoriyalarini tanlang.
            </p>
          </div>

          <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btnGhost" onClick={handleBack} type="button">
              ← Ortga
            </button>
            {selectedFan ? <span className="badge">Tanlangan fan: {FAN_META[selectedFan]?.label}</span> : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginTop: 8,
            }}
          >
            {FAN_ORDER.map((fan) => {
              const meta = FAN_META[fan];
              const isActive = selectedFan === fan;

              return (
                <button
                  key={fan}
                  type="button"
                  className="card"
                  onClick={() => handleFanSelect(fan)}
                  style={{
                    minHeight: 140,
                    textAlign: "left",
                    padding: "20px",
                    border: isActive ? `1px solid ${meta.accent}` : "1px solid rgba(148,163,184,0.18)",
                    background: isActive ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.96)",
                    cursor: "pointer",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                  onMouseEnter={(event) => {
                    (event.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    (event.currentTarget as HTMLButtonElement).style.boxShadow = "0 18px 40px rgba(0,0,0,0.16)";
                  }}
                  onMouseLeave={(event) => {
                    (event.currentTarget as HTMLButtonElement).style.transform = "none";
                    (event.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>{meta.label}</div>
                      <p className="muted" style={{ marginTop: 8, color: "rgba(203,213,225,0.88)", lineHeight: 1.5 }}>
                        {meta.description}
                      </p>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: meta.accent,
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      {meta.label.charAt(0)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedFan ? (
        <div style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 24 }}>
            <div className="h2">{FAN_META[selectedFan]?.label} laboratoriyalari</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Tanlangan fanga oid laboratoriya mavzulari va interaktiv mashg‘ulotlar.
            </p>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              {filtered.map((x) => {
                const meta = FAN_META[x.fan] || FAN_META["fizika"];
                return (
                  <div key={`${x.fan}/${x.lab}`} className="card" style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        padding: 18,
                        background: meta.gradient,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{x.title}</div>
                        <p style={{ margin: "6px 0 0 0", color: "rgba(248,250,252,0.9)", fontSize: 13 }}>{x.desc}</p>
                      </div>
                      <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center" }}>
                        <span style={{ color: "white", fontWeight: 700, fontSize: 22 }}>{meta.label.charAt(0)}</span>
                      </div>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                        <Link className="btn" href={`/labs/${x.fan}/${x.lab}`}>
                          Kirish
                        </Link>
                        <span className="badge">{meta.label}</span>
                        <span className="badge">{x.lab}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
