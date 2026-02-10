import Link from "next/link";
import labs from "@/data/labs.json";

export const metadata = {
  title: "3D laboratoriyalar — Z-avlod",
};

export default function LabsIndex() {
  const grouped = labs.reduce<Record<string, typeof labs>>((acc, it) => {
    acc[it.fan] ||= [];
    acc[it.fan].push(it);
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="card">
        <div className="h1">3D laboratoriyalar</div>
        <p className="muted">
          Bu bo‘limda fanlar bo‘yicha interaktiv 3D laboratoriyalar joylashadi. Test yo‘q — faqat tajriba va kuzatish.
        </p>
      </div>

      {Object.entries(grouped).map(([fan, items]) => (
        <section key={fan} className="grid" style={{ marginTop: 14 }}>
          <div className="card" style={{ gridColumn: "span 12" }}>
            <div className="h2" style={{ textTransform: "capitalize" }}>{fan}</div>
          </div>

          {items.map((it) => (
            <div key={`${it.fan}/${it.lab}`} className="card" style={{ gridColumn: "span 6" }}>
              <div className="h2">{it.title}</div>
              <p className="muted">{it.desc}</p>
              <div className="row" style={{ marginTop: 10 }}>
                <Link className="btn" href={`/labs/${it.fan}/${it.lab}`}>Ochish</Link>
                <span className="badge">Fan: {it.fan}</span>
                <span className="badge">URL: {it.lab}</span>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
