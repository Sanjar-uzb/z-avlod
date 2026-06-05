import PageHero from "@/components/PageHero";

export const metadata = { title: "Geography Map Quest | Z-avlod" };

export default function GeographyQuestPage() {
  return (
    <div className="container">
      <PageHero
        title="Geography Map Quest"
        subtitle="Dunyo xaritasida davlat bayroqlarini aniqlang. Har bir o‘yin 20 ta tasodifiy savol bilan yangi geografik sayohatni taqdim etadi."
        badges={["Geografiya", "Bayroq", "20 ta savol"]}
        actions={[
          { label: "Boshlash", href: "/games/geography-quest/play" },
          { label: "Orqaga", href: "/games", variant: "ghost" },
        ]}
      />
    </div>
  );
}
