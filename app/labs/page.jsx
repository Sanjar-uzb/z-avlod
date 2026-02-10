import Link from "next/link";
import labs from "@/data/labs.json";

export default function LabsIndex() {
  return (
    <div className="container">
      <div className="card hero">
        <div className="badgeRow">
          <span className="badge">3D laboratoriyalar</span>
          <span className="badge">Brauzerda</span>
          <span className="badge">MVP</span>
        </div>

        <h1 className="heroTitle">3D laboratoriyalar</h1>
        <p className="heroSubtitle">
          Bu bo‘limda fanlar bo‘yicha 3D laboratoriyalar joylashadi. Har bir laboratoriyada
          parametrlarni o‘zgartirib natijani ko‘rasiz (test yo‘q).
        </p>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {labs.map((x) => (
          <div className="card" style={{ gridColumn: "span 6" }} key={`${x.fan}-${x.lab}`}>
            <div className="h2">{x.title}</div>
            <p className="muted">{x.desc}</p>
            <div className="row" style={{ marginTop: 10 }}>
              <Link className="btn" href={`/labs/${x.fan}/${x.lab}`}>Ochish</Link>
              <span className="badge">Fan: {x.fan}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
