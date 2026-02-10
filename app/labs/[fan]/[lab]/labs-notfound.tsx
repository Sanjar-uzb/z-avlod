import Link from "next/link";

export default function LabNotFound({ fan, lab }: { fan: string; lab: string }) {
  return (
    <div className="container">
      <div className="card">
        <div className="h1">Laboratoriya topilmadi</div>
        <p className="muted">
          Siz ochgan URL ro‘yxatda yo‘q: <b>{`/labs/${fan}/${lab}`}</b>. /labs sahifasidan laboratoriyani tanlang.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn" href="/labs">Barcha laboratoriyalar</Link>
          <Link className="btn btnGhost" href="/">Bosh sahifa</Link>
        </div>
      </div>
    </div>
  );
}
