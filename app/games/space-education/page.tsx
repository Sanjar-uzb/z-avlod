import PageHero from "@/components/PageHero";

export const metadata = { title: "Space Education Game | Z-avlod" };

export default function SpaceEducationPage() {
  return (
    <div className="container">
      <PageHero
        title="Space Education Game"
        subtitle="Kosmos va astronomiya bo‘yicha interaktiv o‘yinlar. Koinot sirlarini o‘rganib, yulduzlar bilan sayohat qiling."
        badges={["Kosmos", "Astronomiya", "Interaktiv"]}
        actions={[
          { label: "Boshlash", href: "/games/space-education/play" },
          { label: "Orqaga", href: "/games", variant: "ghost" },
        ]}
      />
    </div>
  );
}
