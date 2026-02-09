"use client";
import { useEffect, useMemo, useState } from "react";
import { getReflections, requireProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import methods from "@/data/methods.json";

export default function ReflectionsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!requireProfile()) router.push("/start");
    setItems(getReflections());
  }, [router]);

  const byMethod = useMemo(() => {
    const map = {};
    for (const m of methods) map[m.id] = m.title;
    return map;
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="h2">Refleksiyalar</div>
        <div className="muted">Yozilgan refleksiyalar shu qurilmada saqlanadi.</div>
      </div>

      <div className="list" style={{marginTop: 14}}>
        {items.length === 0 ? (
          <div className="card">
            <div className="muted">Hali refleksiya yo‘q.</div>
            <div className="row" style={{marginTop: 10}}>
              <Link className="btn" href="/methods">Metodlarni ochish</Link>
            </div>
          </div>
        ) : (
          items.map((r, idx) => (
            <div className="card" key={idx}>
              <div className="itemTitle">{byMethod[r.methodId] || r.methodTitle || "Metod"}</div>
              <div className="itemMeta">
                <span className="badge">O‘quvchi: {r.student}</span>
                {r.org ? <span className="badge">Sinf/Guruh: {r.org}</span> : null}
                <span className="badge">Sana: {new Date(r.createdAt).toLocaleString("uz-UZ")}</span>
              </div>
              <p style={{whiteSpace:"pre-wrap", marginTop: 10}}>{r.text}</p>
              <div className="row" style={{marginTop: 10}}>
                <Link className="btn btnGhost" href={`/method?id=${r.methodId}`}>Metod</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
