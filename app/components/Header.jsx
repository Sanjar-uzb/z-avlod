"use client";
import Link from "next/link";
import { getProfile, clearAll } from "@/lib/storage";
import { useEffect, useState } from "react";

export default function Header() {
  const [p, setP] = useState(null);

  useEffect(() => setP(getProfile()), []);

  function reset() {
    if (confirm("Hammasini tozalaysizmi? (Ism-familiya, natijalar, refleksiya)")) {
      clearAll();
      location.href = "/Z-avlod/";
    }
  }

  return (
    <header className="header">
      <div className="container headerRow">
        <Link className="brand" href="/">
          Z-avlod
        </Link>

        <nav className="nav">
          <Link href="/start">Boshlash</Link>
          <Link href="/methods">Metodlar</Link>
          <Link href="/reflections">Refleksiya</Link>
          <Link href="/profile">Profil</Link>
        </nav>

        <div className="profileMini">
          {p?.firstName ? (
            <span className="pill">{p.firstName} {p.lastName}</span>
          ) : (
            <span className="pill pillWarn">Profil kiritilmagan</span>
          )}
          <button className="btn btnGhost" onClick={reset}>Tozalash</button>
        </div>
      </div>
    </header>
  );
}
