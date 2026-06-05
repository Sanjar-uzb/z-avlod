import Link from "next/link";

export default function LabsNotFound() {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 860, margin: "0 auto" }}>
        <div className="h2">Laboratoriya topilmadi</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Siz ochgan URL ro‘yxatda yo‘q. /labs sahifasidan laboratoriyani tanlang.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn" href="/labs">Barcha laboratoriyalar</Link>
          <Link className="btn btnGhost" href="/">Bosh sahifa</Link>
        </div>
      </div>
    </div>
  );
}
