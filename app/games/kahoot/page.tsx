import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import PinRedirect from "./PinRedirect";

export const metadata = { title: "Kahoot Live | Z-avlod" };

export default function KahootLiveLanding() {
  return (
    <div className="container">
      <Suspense fallback={null}>
        <PinRedirect />
      </Suspense>

      <PageHero
        title="Kahoot Live"
        subtitle="O‘qituvchi testni TXT yoki Word fayldan import qiladi, PIN yaratadi, o‘quvchilar esa ismi bilan kirmoqda. Sinf bilan real vaqtda o‘ynang."
        badges={["Host/Join", "PIN", "QR kod", "Real-time"]}
        actions={[
          { label: "O‘qituvchi (Host)", href: "/games/kahoot/host" },
          { label: "O‘quvchi (Join)", href: "/games/kahoot/join", variant: "ghost" },
        ]}
      />
    </div>
  );
}
