import Link from "next/link";
import PageHero from "@/components/PageHero";

const FANS = [
  { slug: "fizika", label: "Fizika" },
  { slug: "kimyo", label: "Kimyo" },
  { slug: "biologiya", label: "Biologiya" },
  { slug: "informatika", label: "Informatika" },
];

export const metadata = { title: "AI krosvord | Z-avlod" };

export default function AiKrosvordPage() {
  return (
    <div className="container">
      <PageHero
        title="AI Krosvord"
        subtitle="Sun'iy intellekt yordamida yaratilgan fanga oid krossvordlar. Fan tanlang va 10 ta savoldan iborat praktykani yeching."
        badges={["AI", "So‘zlar", "Ta’lim"]}
        actions={[
          { label: "Boshlash", href: "/games/ai-krosvord/play" },
          { label: "Orqaga", href: "/games", variant: "ghost" },
        ]}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 20 }}>
          {FANS.map((fan) => (
            <Link
              key={fan.slug}
              href={`/games/ai-krosvord/play?fan=${fan.slug}`}
              className="btn"
              style={{ justifyContent: "center", minHeight: 52 }}
            >
              {fan.label}
            </Link>
          ))}
        </div>
      </PageHero>
    </div>
  );
}
