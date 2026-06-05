"use client";
import { useEffect, useState } from "react";
import { setProfile, getProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function Start() {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [org, setOrg] = useState(""); // optional: sinf/guruh/maktab
  const router = useRouter();

  useEffect(() => {
    const p = getProfile();
    if (p?.firstName && p?.lastName) {
      setFirst(p.firstName);
      setLast(p.lastName);
      setOrg(p.org || "");
    }
  }, []);

  function save() {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Ism va familiyani kiriting.");
      return;
    }
    setProfile({ firstName: firstName.trim(), lastName: lastName.trim(), org: org.trim() });
    router.push("/methods");
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 520, margin: "0 auto"}}>
        <div className="h2">Boshlash</div>
        <div className="muted">Registratsiya shart emas. Ism-familiya kiritish kifoya.</div>

        <div style={{marginTop: 14}}>
          <label className="muted">Ism</label>
          <input className="input" value={firstName} onChange={(e)=>setFirst(e.target.value)} placeholder="Ism" />
        </div>

        <div style={{marginTop: 12}}>
          <label className="muted">Familiya</label>
          <input className="input" value={lastName} onChange={(e)=>setLast(e.target.value)} placeholder="Familiya" />
        </div>

        <div style={{marginTop: 12}}>
          <label className="muted">Sinf/Guruh (ixtiyoriy)</label>
          <input className="input" value={org} onChange={(e)=>setOrg(e.target.value)} placeholder="Masalan: 10-A / 2-kurs 205-guruh" />
        </div>

        <div className="row" style={{marginTop: 14}}>
          <button className="btn" onClick={save}>Saqlash va davom etish</button>
        </div>
      </div>
    </div>
  );
}
