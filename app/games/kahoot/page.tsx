import PageHero from "@/components/PageHero";

export const metadata = { title: "Kahoot Live | Z-avlod" };

export default function KahootLiveLanding() {
  return (
    <div className="container">
      <PageHero
        title="Kahoot Live"
        subtitle="O‘qituvchi testni TXT yoki Word fayldan import qiladi, PIN yaratadi, o‘quvchilar esa ismi bilan kirmoqda. Sinf bilan real vaqtda o‘ynang."
        badges={["Host/Join", "PIN", "Real-time"]}
        actions={[
          { label: "O‘qituvchi (Host)", href: "/games/kahoot/host" },
          { label: "O‘quvchi (Join)", href: "/games/kahoot/join", variant: "ghost" },
        ]}
      />
    </div>
  );
}