"use client";
import { useEffect, useState } from "react";
import { setProfile, getProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { regions } from "@/lib/regions";

export default function Start() {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [org, setOrg] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [institution, setInstitution] = useState("");
  const router = useRouter();

  useEffect(() => {
    const p = getProfile();
    if (p?.firstName && p?.lastName) {
      setFirst(p.firstName);
      setLast(p.lastName);
      setOrg(p.org || "");
      setRegion(p.region || "");
      setDistrict(p.district || "");
      setInstitution(p.institution || "");
    }
  }, []);

  function save() {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Ism va familiyani kiriting.");
      return;
    }
    setProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      org: org.trim(),
      region: region.trim(),
      district: district.trim(),
      institution: institution.trim(),
    });
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

        <div style={{marginTop: 12}}>
          <label className="muted">Viloyat</label>
          <select className="input" value={region} onChange={(e)=>{setRegion(e.target.value); setDistrict("");}}>
            <option value="">Viloyatni tanlang</option>
            {Object.keys(regions).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div style={{marginTop: 12}}>
          <label className="muted">Tuman</label>
          <select className="input" value={district} onChange={(e)=>setDistrict(e.target.value)} disabled={!region}>
            <option value="">Tumanni tanlang</option>
            {region && regions[region].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div style={{marginTop: 12}}>
          <label className="muted">Ta'lim muassasa raqami</label>
          <input className="input" value={institution} onChange={(e)=>setInstitution(e.target.value)} placeholder="Masalan: 12345" />
        </div>

        <div className="row" style={{marginTop: 14}}>
          <button className="btn" onClick={save}>Saqlash va davom etish</button>
        </div>
      </div>
    </div>
  );
}
