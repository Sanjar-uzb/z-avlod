import Link from "next/link";
import labs from "@/data/labs.json";

export const metadata = { title: "3D laboratoriyalar — Z-avlod" };

export default function LabsIndex() {
  return (
    <div className="container">
      <div className="card">
        <div className="h2">3D laboratoriyalar</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Bu bo‘limda fanlar bo‘yicha interaktiv 3D laboratoriyalar joylashadi. Test yo‘q — faqat tajriba va kuzatish.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {labs.map((x) => (
          <div key={`${x.fan}/${x.lab}`} className="card" style={{ gridColumn: "span 6" }}>
            <div className="h2">{x.title}</div>
            <p className="muted" style={{ marginTop: 6 }}>{x.desc}</p>

            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn" href={`/labs/${x.fan}/${x.lab}`}>Ochish</Link>
              <span className="badge">Fan: {x.fan}</span>
              <span className="badge">URL: {x.lab}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
