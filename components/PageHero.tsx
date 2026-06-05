import Link from "next/link";
import type { ReactNode } from "react";

type HeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
};

type PageHeroProps = {
  title: string;
  subtitle: string;
  badges?: string[];
  actions?: HeroAction[];
  children?: ReactNode;
};

export default function PageHero({ title, subtitle, badges = [], actions = [], children }: PageHeroProps) {
  return (
    <section
      className="card hero"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 24,
        background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(10,25,44,0.85))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 22%), radial-gradient(circle at bottom right, rgba(16,185,129,0.14), transparent 26%)",
          pointerEvents: "none",
          opacity: 0.95,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {badges.length > 0 && (
          <div className="badgeRow" style={{ marginBottom: 18 }}>
            {badges.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))}
          </div>
        )}

        <h1 className="heroTitle" style={{ color: "#f8fafc" }}>{title}</h1>
        <p className="heroSubtitle" style={{ color: "#cbd5e1" }}>{subtitle}</p>

        {actions.length > 0 && (
          <div className="row" style={{ marginTop: 20 }}>
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={action.variant === "ghost" ? "btn btnGhost" : "btn btnLarge"}
                style={{ minWidth: 142 }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}

        {children && <div style={{ marginTop: 20 }}>{children}</div>}
      </div>
    </section>
  );
}
