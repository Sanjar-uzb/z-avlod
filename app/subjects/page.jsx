"use client";

import Link from "next/link";
import subjects from "@/data/subjects.json";

export default function SubjectsPage() {
  return (
    <div className="container">
      <div className="card hero">
        <div className="h2">Fanlar bo‘yicha o‘yinlar</div>
        <p className="muted">
          Bu bo‘lim 5–6 sinf (oson) va 7–9 sinf (o‘rta) darajalari bo‘yicha
          gamifikatsiya asosida tayyorlangan savol-javob o‘yinlarini o‘z ichiga oladi.
          Har bir fan uchun 10 tadan o‘yin-savol mavjud.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {subjects.map((s) => (
          <div key={s.key} className="card" style={{ gridColumn: "span 6" }}>
            <div className="h2" style={{ marginBottom: 6 }}>
              {s.title}
            </div>

            <div className="muted">
              Tanlang: 5–6 sinf yoki 7–9 sinf darajasi.
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn" href={`/subject?name=${s.key}&level=easy`}>
                5–6 sinf (oson)
              </Link>

              <Link className="btn btnGhost" href={`/subject?name=${s.key}&level=medium`}>
                7–9 sinf (o‘rta)
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="h3">Izoh</div>
        <p className="muted">
          Ushbu o‘yinlar Kahoot, Edugames kabi platformalarning soddalashtirilgan shakli bo‘lib,
          o‘quvchilarning motivatsiyasi, faolligi va tezkor fikrlashini rivojlantirishga xizmat qiladi.
        </p>

        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn btnGhost" href="/">
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
