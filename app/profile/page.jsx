"use client";
import { useEffect, useMemo, useState } from "react";
import { getProfile, setProfile, getQuizResults } from "@/lib/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { regions } from "@/lib/regions";

export default function ProfilePage() {
  const router = useRouter();
  const [p, setP] = useState({
    firstName: "",
    lastName: "",
    org: "",
    region: "",
    district: "",
    institution: "",
  });

  useEffect(() => {
    const cur = getProfile();
    if (!cur?.firstName) {
      router.push("/start");
      return;
    }
    setP({
      firstName: cur.firstName || "",
      lastName: cur.lastName || "",
      org: cur.org || "",
      region: cur.region || "",
      district: cur.district || "",
      institution: cur.institution || "",
    });
  }, [router]);

  const results = useMemo(() => {
    const r = getQuizResults();
    return Object.values(r).sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  }, []);

  function save() {
    if (!p.firstName.trim() || !p.lastName.trim()) {
      alert("Ism va familiya kerak.");
      return;
    }
    setProfile({
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      org: (p.org || "").trim(),
      region: (p.region || "").trim(),
      district: (p.district || "").trim(),
      institution: (p.institution || "").trim(),
    });
    alert("Profil saqlandi.");
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">Profil</div>
        <div className="muted">Ism-familiya (registratsiyasiz). Natijalar shu qurilmada saqlanadi.</div>

        <div className="grid" style={{marginTop: 14}}>
          <div className="card" style={{gridColumn:"span 6"}}>
            <div className="h3">Shaxsiy ma’lumot</div>
            <div style={{marginTop: 10}}>
              <label className="muted">Ism</label>
              <input className="input" value={p.firstName} onChange={(e)=>setP({...p, firstName:e.target.value})} />
            </div>
            <div style={{marginTop: 12}}>
              <label className="muted">Familiya</label>
              <input className="input" value={p.lastName} onChange={(e)=>setP({...p, lastName:e.target.value})} />
            </div>
            <div style={{marginTop: 12}}>
              <label className="muted">Sinf/Guruh (ixtiyoriy)</label>
              <input className="input" value={p.org || ""} onChange={(e)=>setP({...p, org:e.target.value})} />
            </div>

            <div style={{marginTop: 12}}>
              <label className="muted">Viloyat</label>
              <select className="input" value={p.region} onChange={(e)=>setP({...p, region:e.target.value, district:""})}>
                <option value="">Viloyatni tanlang</option>
                {Object.keys(regions).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div style={{marginTop: 12}}>
              <label className="muted">Tuman</label>
              <select className="input" value={p.district} onChange={(e)=>setP({...p, district:e.target.value})} disabled={!p.region}>
                <option value="">Tumanni tanlang</option>
                {p.region && regions[p.region].map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div style={{marginTop: 12}}>
              <label className="muted">Ta'lim muassasa raqami</label>
              <input className="input" value={p.institution || ""} onChange={(e)=>setP({...p, institution:e.target.value})} placeholder="Masalan: 12345" />
            </div>

            <div className="row" style={{marginTop: 12}}>
              <button className="btn" onClick={save}>Saqlash</button>
              <Link className="btn btnGhost" href="/methods">Metodlar</Link>
            </div>
          </div>

          <div className="card" style={{gridColumn:"span 6"}}>
            <div className="h3">Quiz natijalari</div>

            {results.length === 0 ? (
              <div className="muted" style={{marginTop: 10}}>Hali quiz yechilmagan.</div>
            ) : (
              <div className="list" style={{marginTop: 10}}>
                {results.map((r, idx) => (
                  <div className="card" key={idx}>
                    <div className="itemTitle">{r.quizTitle}</div>
                    <div className="itemMeta">
                      <span className="badge">Metod: {r.methodTitle}</span>
                      <span className="badge">Ball: {r.score}/{r.total}</span>
                      <span className="badge">Foiz: {r.percent}%</span>
                      <span className="badge">Daraja: {r.level}</span>
                    </div>
                    <div className="row" style={{marginTop: 10}}>
                      <Link className="btn btnGhost" href={`/quiz?id=${r.quizId}`}>Qayta ishlash</Link>
                      <Link className="btn btnGhost" href={`/method?id=${r.methodId}`}>Metod</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
