import labs from "@/data/labs.json";
import LabClient from "./LabClient";

export function generateStaticParams() {
  return labs.map((x) => ({
    fan: x.fan,
    lab: x.lab,
  }));
}

export default function LabPage({ params }) {
  return <LabClient params={params} />;
}
