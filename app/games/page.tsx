import GameThumbnail from "../../components/GameThumbnail";
import PageHero from "@/components/PageHero";

export const metadata = { title: "O'yinlar | Z-avlod" };

export default function GamesLanding() {
  return (
    <div className="container">
      <PageHero
        title="O'yinlar"
        subtitle="Interaktiv o'yinlar qatoridan tanlang: fan, geografiya, matematika va tabiat bo‘yicha ajoyib sarguzashtlar."
        badges={["Gamifikatsiya", "O‘qituvchi/ta’lim", "Interaktiv"]}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          <GameThumbnail href="/games/kahoot" title="Kahoot Live" subtitle="Real-time quiz" accent="#ef4444" />
          <GameThumbnail href="/games/electric" title="Electric Simulyator" subtitle="Circuit puzzles" accent="#f59e0b" />
          <GameThumbnail href="/games/network" title="Tarmoq Simulyatori" subtitle="Network challenges" accent="#06b6d4" />

          <GameThumbnail href="/games/geography-quest" title="Geografiya" subtitle="Find the flags" accent="#10b981" />
          <GameThumbnail href="/games/english-rpg" title="Engliz tilida suhbat" subtitle="Dialog adventures" accent="#f472b6" />

          <GameThumbnail href="/games/coding-puzzle" title="Kod yozish" subtitle="Programming riddles" accent="#06b6d4" />
          <GameThumbnail href="/games/space-education" title="Astronomiya" subtitle="Space missions" accent="#2563eb" />
          <GameThumbnail href="/games/ai-krosvord" title="AI Krosvord" subtitle="Crossword with AI" accent="#fb7185" />
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <p className="muted" style={{ margin: 0 }}>
            Qaysi o'yin bilan boshlashni xohlaringizga qarab tanlang.
          </p>
        </div>
      </PageHero>
    </div>
  );
}
