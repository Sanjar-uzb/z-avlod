"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import { useSimStore } from "../store/useSimStore";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Graph() {
  const data = useSimStore((state) => state.data);

  const chartData = useMemo(
    () => ({
      labels: data.map((point) => point.time.toFixed(1)),
      datasets: [
        {
          label: "Tezlik (m/s)",
          data: data.map((point) => point.velocity),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.18)",
          tension: 0.28,
          fill: true,
        },
        {
          label: "Kinetik energiya (J)",
          data: data.map((point) => point.kinetic),
          borderColor: "#fb7185",
          backgroundColor: "rgba(251, 113, 133, 0.08)",
          tension: 0.24,
        },
        {
          label: "Potensial energiya (J)",
          data: data.map((point) => point.potential),
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.08)",
          tension: 0.24,
        },
      ],
    }),
    [data]
  );

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: "#dbeafe",
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#93c5fd" },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
          y: {
            ticks: { color: "#93c5fd" },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
        },
      }}
    />
  );
}
