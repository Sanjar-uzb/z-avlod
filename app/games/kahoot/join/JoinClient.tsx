"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { joinRoom, roomExists } from "@/lib/kahootLive";

export default function JoinClient() {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function join() {
    setErr("");
    const p = pin.trim();
    const n = name.trim();

    if (p.length < 4) return setErr("PIN kiriting.");
    if (n.length < 2) return setErr("Ismingizni kiriting.");

    setBusy(true);

    try {
      const ok = await roomExists(p);
      if (!ok) {
        setErr("Bunday PIN topilmadi.");
        setBusy(false);
        return;
      }

      const playerId = await joinRoom(p, n);
      router.push(
        `/games/kahoot/play?pin=${encodeURIComponent(p)}&role=player&pid=${encodeURIComponent(playerId)}&name=${encodeURIComponent(n)}`
      );
    } catch (e: any) {
      setErr(e?.message || "Ulanishda xatolik");
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">O‘quvchi (Join)</div>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">PIN</div>
            <input
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masalan: 123456"
            />
          </div>

          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">Ism</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingiz"
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={join} disabled={busy}>
            {busy ? "Ulanmoqda..." : "Kirish"}
          </button>
          <Link className="btn btnGhost" href="/games/kahoot">Orqaga</Link>
        </div>

        {err && (
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,107,107,.35)" }}>
            <div className="muted">{err}</div>
          </div>
        )}
      </div>
    </div>
  );
}