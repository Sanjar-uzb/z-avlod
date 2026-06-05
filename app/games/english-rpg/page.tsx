import PageHero from "@/components/PageHero";

export const metadata = { title: "English RPG Game | Z-avlod" };

export default function EnglishRpgPage() {
  return (
    <div className="container">
      <PageHero
        title="English RPG Game"
        subtitle="Ingliz tilini o‘rganish uchun dialoglar, sarguzashtlar va rolli o‘yinlar bilan aktyorlik qiling. Har bir savol yangi so‘z boyligini ochadi."
        badges={["Dialog", "RPG", "Til o‘rganish"]}
        actions={[
          { label: "Boshlash", href: "/games/english-rpg/play" },
          { label: "Orqaga", href: "/games", variant: "ghost" },
        ]}
      />
    </div>
  );
}
