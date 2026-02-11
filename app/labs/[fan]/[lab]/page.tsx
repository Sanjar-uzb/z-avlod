import labsData from "@/data/labs.json";
import LabClient from "./LabClient";

type LabEntry = { fan: string; lab: string; title: string; desc: string };
const labs = labsData as LabEntry[];

// STATIC EXPORT uchun shart
export function generateStaticParams() {
  return labs.map((x) => ({ fan: x.fan, lab: x.lab }));
}

// Next 16 Turbopack: params Promise bo‘lib kelishi mumkin
export default async function LabPage({
  params,
}: {
  params: Promise<{ fan: string; lab: string }> | { fan: string; lab: string };
}) {
  const p = (params instanceof Promise) ? await params : params;
  return <LabClient fan={p.fan} lab={p.lab} />;
}
