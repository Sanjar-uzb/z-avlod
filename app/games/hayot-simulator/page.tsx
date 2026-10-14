import type { Metadata } from "next";
import HayotGame from "./HayotGame";

export const metadata: Metadata = {
  title: "Hayot simulyatori | Z-avlod",
  description: "Qahramonni boshqaring, virtual dunyoni o‘rganing va hayotiy missiyalarni bajaring.",
};

export default function HayotSimulatorPage() {
  return <HayotGame />;
}
