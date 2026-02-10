import labs from "@/data/labs.json";
import LabClient from "./LabClient";

export function generateStaticParams() {
  return labs.map((x) => ({ fan: x.fan, lab: x.lab }));
}

export default function Page({ params }: { params: { fan: string; lab: string } }) {
  return <LabClient fan={params.fan} lab={params.lab} />;
}
