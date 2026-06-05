import labsData from "@/data/labs.json";
import LabClient from "./LabClient";

type LabEntry = {
  fan: string;
  lab: string;
  title: string;
  desc: string;
};

const labs = labsData as LabEntry[];

export function generateStaticParams() {
  return labs.map((x) => ({
    fan: x.fan,
    lab: x.lab,
  }));
}

type PageProps = {
  params: {
    fan: string;
    lab: string;
  };
};

export default async function LabPage({ params }: PageProps) {
  const { fan, lab } = await params;
  return <LabClient fan={fan} lab={lab} />;
}