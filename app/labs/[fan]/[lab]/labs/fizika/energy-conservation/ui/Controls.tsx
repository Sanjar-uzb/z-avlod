"use client";

import { useSimStore } from "../store/useSimStore";
import { exportCSV } from "../utils/exportCSV";

export default function Controls() {
  const data = useSimStore((state) => state.data);

  return (
    <button className="btn btnGhost" onClick={() => exportCSV(data)} disabled={data.length === 0}>
      CSV yuklab olish
    </button>
  );
}
