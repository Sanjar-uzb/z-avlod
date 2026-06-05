import type { CSSProperties } from "react";

type LabHeroProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 24,
  minHeight: 280,
  padding: 28,
  color: "#f8fafc",
  background: "linear-gradient(160deg, #08212b 0%, #0e3f2e 34%, #0a2748 100%)",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
};

const backgroundShape: CSSProperties = {
  position: "absolute",
  borderRadius: "50%",
  filter: "blur(30px)",
  opacity: 0.48,
};

export default function LabHero({ title, subtitle, tags = [] }: LabHeroProps) {
  return (
    <section style={{ marginBottom: 20 }}>
      <div style={heroStyle}>
        <div
          style={{
            ...backgroundShape,
            width: 260,
            height: 260,
            background: "radial-gradient(circle, rgba(34,197,94,0.55), transparent 58%)",
            top: -80,
            right: -90,
          }}
        />
        <div
          style={{
            ...backgroundShape,
            width: 260,
            height: 260,
            background: "radial-gradient(circle, rgba(59,130,246,0.45), transparent 52%)",
            bottom: -80,
            left: -90,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 12 }}>
                {title}
              </div>
              {subtitle ? (
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: 16, lineHeight: 1.75, maxWidth: 760 }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {tags.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              {tags.map((tag) => (
                <span key={tag} className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.2)" }}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
