"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { joinRoom } from "@/lib/kahootLive";

const SESSION_KEY = "zavlod_kahoot_session";

type Session = { pin: string; playerId: string; name: string };

function playUrl(pin: string, playerId: string, name: string) {
  return `/games/kahoot/play?pin=${encodeURIComponent(pin)}&role=player&pid=${encodeURIComponent(
    playerId
  )}&name=${encodeURIComponent(name)}`;
}

function subscribeSession() {
  return () => {};
}

function readSessionRaw() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function errMessage(e: unknown) {
  return e instanceof Error && e.message ? e.message : "Ulanishda xatolik";
}

export default function JoinClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [pin, setPin] = useState(sp.get("pin") || "");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const sessionRaw = useSyncExternalStore(subscribeSession, readSessionRaw, () => "");

  const session = useMemo<Session | null>(() => {
    if (!sessionRaw) return null;
    try {
      const parsed = JSON.parse(sessionRaw) as Session;
      return parsed?.pin && parsed?.playerId ? parsed : null;
    } catch {
      return null;
    }
  }, [sessionRaw]);

  async function join() {
    setErr("");
    const p = pin.trim();
    const n = name.trim();

    if (p.length < 4) {
      setErr("PIN kiriting.");
      return;
    }
    if (n.length < 2) {
      setErr("Ismingizni kiriting.");
      return;
    }

    setBusy(true);

    try {
      const existingPlayerId =
        session && session.pin === p ? session.playerId : undefined;

      const res = await joinRoom(p, n, existingPlayerId);

      if (!res.ok) {
        if (res.reason === "room-not-found") setErr("Bunday PIN topilmadi.");
        else if (res.reason === "game-started")
          setErr("O‘yin allaqachon boshlangan. O‘qituvchidan yangi PIN so‘rang.");
        else if (res.reason === "invalid-name") setErr("Ismingizni to‘liq kiriting.");
        else setErr("Ulanishda xatolik. Qayta urinib ko‘ring.");
        setBusy(false);
        return;
      }

      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ pin: p, playerId: res.playerId, name: res.name })
        );
      } catch {
        // session storage is optional
      }

      router.push(playUrl(p, res.playerId, res.name));
    } catch (e) {
      setErr(errMessage(e));
      setBusy(false);
    }
  }

  function resume() {
    if (!session) return;
    router.push(playUrl(session.pin, session.playerId, session.name));
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">O‘quvchi (Join)</div>
        <p className="muted" style={{ marginTop: 6 }}>
          PIN ni kiriting yoki host bergan QR kodni skanerlang.
        </p>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">PIN</div>
            <input
              className="input"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErr("");
              }}
              placeholder="Masalan: 123456"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
            />
          </div>

          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">Ism</div>
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") join();
              }}
              placeholder="Ismingiz"
              autoComplete="name"
              maxLength={40}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn" onClick={join} disabled={busy}>
            {busy ? "Ulanmoqda..." : "Kirish"}
          </button>
          <Link className="btn btnGhost" href="/games/kahoot">
            Orqaga
          </Link>
        </div>

        {session && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div className="muted">
                Oldingi sessiya: <b>{session.name}</b> · PIN {session.pin}
              </div>
              <button className="btn btnGhost" onClick={resume}>
                Davom etish
              </button>
            </div>
          </div>
        )}

        {err && (
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,107,107,.35)" }}>
            <div className="muted">{err}</div>
          </div>
        )}
      </div>
    </div>
  );
}
