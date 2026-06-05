import Link from "next/link";

const getGameType = (href: string) => {
  const key = href.replace(/^\/games\//, "").split("/")[0] || "default";
  if (key.includes("kahoot")) return "quiz";
  if (key.includes("electric")) return "electric";
  if (key.includes("network")) return "network";
  if (key.includes("math")) return "math";
  if (key.includes("chemistry")) return "chemistry";
  if (key.includes("geography")) return "geography";
  if (key.includes("english")) return "english";
  if (key.includes("physics")) return "physics";
  if (key.includes("biology")) return "biology";
  if (key.includes("space")) return "space";
  if (key.includes("multiplayer")) return "multiplayer";
  return "default";
};

const renderIcon = (type: string, accent: string) => {
  const base = `linear-gradient(135deg, ${accent} 0%, #0f172a 100%)`;

  switch (type) {
    case "electric":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <path d="M28 30 L44 50 L34 50 L54 78" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
          <circle cx="32" cy="32" r="6" fill="#f97316" />
          <circle cx="68" cy="68" r="6" fill="#4ade80" />
          <path d="M60 20 L50 36 L66 36 L46 70" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "geography":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <circle cx="50" cy="50" r="40" fill={base} />
          <path d="M10 50 H90 M50 10 V90 M30 20 C40 24 58 24 70 20 M30 80 C42 76 58 76 70 80" stroke="#34d399" strokeWidth="3" fill="none" />
          <circle cx="70" cy="30" r="5" fill="#fff" />
        </svg>
      );
    case "english":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="18" width="80" height="58" rx="16" fill={base} />
          <path d="M30 38 H70 M30 54 H60 M30 70 H55" stroke="#a5b4fc" strokeWidth="5" strokeLinecap="round" />
          <path d="M38 48 L42 42 L47 50" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <circle cx="26" cy="28" r="7" fill="#34d399" />
          <circle cx="72" cy="30" r="7" fill="#38bdf8" />
          <circle cx="50" cy="68" r="7" fill="#f472b6" />
          <path d="M32 34 L46 60 L56 46 L68 34" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "math":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <text x="28" y="50" fill="#fef08a" fontSize="30" fontWeight="800">+</text>
          <text x="50" y="67" fill="#a5b4fc" fontSize="28" fontWeight="700">×</text>
          <text x="18" y="72" fill="#fff" fontSize="22" fontWeight="700">9</text>
        </svg>
      );
    case "physics":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <circle cx="34" cy="36" r="10" fill="#60a5fa" opacity="0.9" />
          <circle cx="66" cy="64" r="10" fill="#fbbf24" opacity="0.9" />
          <path d="M40 40 C50 24 62 24 72 40" stroke="#fff" strokeWidth="4" fill="none" />
        </svg>
      );
    case "biology":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <path d="M30 70 C40 30 60 30 70 70" stroke="#4ade80" strokeWidth="8" fill="none" />
          <circle cx="34" cy="62" r="6" fill="#d9f99d" />
          <circle cx="66" cy="62" r="6" fill="#86efac" />
        </svg>
      );
    case "space":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <path d="M30 70 L42 32 L58 50 L72 26" fill="none" stroke="#bfdbfe" strokeWidth="5" strokeLinecap="round" />
          <circle cx="64" cy="34" r="5" fill="#f8fafc" />
        </svg>
      );
    case "chemistry":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <path d="M40 30 L60 30 L70 58 L30 58 Z" fill="#38bdf8" opacity="0.9" />
          <circle cx="40" cy="30" r="5" fill="#fff" />
          <circle cx="60" cy="30" r="5" fill="#fff" />
        </svg>
      );
    case "multiplayer":
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <circle cx="36" cy="44" r="10" fill="#f97316" />
          <circle cx="64" cy="44" r="10" fill="#22c55e" />
          <path d="M32 58 C40 70 60 70 68 58" stroke="#fff" strokeWidth="4" fill="none" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" style={{ width: 72, height: 72 }}>
          <rect x="10" y="10" width="80" height="80" rx="18" fill={base} />
          <path d="M30 40 H70 M40 30 V70 M60 30 V70" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};

export default function GameThumbnail({
  href,
  title,
  subtitle,
  accent = "#06b6d4",
}: {
  href: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  const gameType = getGameType(href);

  return (
    <Link
      href={href}
      className="card"
      style={{
        display: "block",
        padding: 20,
        textDecoration: "none",
        minHeight: 144,
        transition: "transform 180ms ease, box-shadow 180ms ease",
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(10,20,34,0.94))",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            display: "grid",
            placeItems: "center",
            background: `radial-gradient(circle at top left, ${accent}, rgba(15,23,42,0.8) 85%)`,
            boxShadow: `0 24px 60px rgba(15, 23, 42, 0.24)`,
          }}
        >
          {renderIcon(gameType, accent)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
