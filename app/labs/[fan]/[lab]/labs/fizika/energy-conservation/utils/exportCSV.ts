"use client";

import { saveAs } from "file-saver";
import type { EnergySample } from "../store/useSimStore";

export function exportCSV(data: EnergySample[]) {
  const header = "time,velocity,kinetic,potential,total,height,progress";
  const rows = data.map((point) =>
    [
      point.time.toFixed(3),
      point.velocity.toFixed(3),
      point.kinetic.toFixed(3),
      point.potential.toFixed(3),
      point.total.toFixed(3),
      point.height.toFixed(3),
      point.progress.toFixed(3),
    ].join(",")
  );

  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  saveAs(blob, "energy-conservation-simulation.csv");
}
