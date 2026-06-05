import PageHero from "@/components/PageHero";

export const metadata = { title: "Coding Puzzle Game | Z-avlod" };

export default function CodingPuzzlePage() {
  return (
    <div className="container">
      <PageHero
        title="Coding Puzzle Game"
        subtitle="Dasturlash mantiqini o‘rgatadigan jumboqlar orqali algoritmik fikrlashni mustahkamlang. Har bir bosqich yangi kod muammosini beradi."
        badges={["Dasturlash", "Mantiq", "Jumboq"]}
        actions={[
          { label: "Boshlash", href: "/games/coding-puzzle/play" },
          { label: "Orqaga", href: "/games", variant: "ghost" },
        ]}
      />
    </div>
  );
}
