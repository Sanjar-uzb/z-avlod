"use client";

import LabHero from "../../../../../components/LabHero";
import BackButton from "../../../../../components/BackButton";

export default function GenericLab({ entry }: { entry: { fan: string; lab: string; title: string; desc: string } }) {
  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <BackButton href={`/labs?fan=${entry.fan}`} />
      <LabHero title={entry.title} subtitle={entry.desc} />

      <div style={{ padding: 6 }}>
        <div className="h2" style={{ marginBottom: 8 }}>{entry.title}</div>
        <p className="muted" style={{ marginBottom: 16 }}>{entry.desc}</p>
        <p style={{ marginBottom: 12 }}>
          Bu laboratoriya hozircha interaktiv demo sifatida ishlaydi. Sizga yangi funksiya yaratish uchun loyiha bo‘sh joy qoldirildi.
        </p>
        <ul>
          <li>Parametrlar: <b>fan={entry.fan}</b>, <b>lab={entry.lab}</b>.</li>
          <li>Bu yerda grafik / 3D sahna qo‘shishingiz mumkin.</li>
          <li>Har bir fan uchun 10+ mashqni ustida ishlash uchun umumiy shablon.</li>
        </ul>
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" onClick={() => window.alert("Hozircha bu umumiy placeholder lab sahifasi.")}>Ko‘proq</button>
        </div>
      </div>
    </div>
  );
}
