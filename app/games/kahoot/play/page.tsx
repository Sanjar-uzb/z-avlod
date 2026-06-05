import { Suspense } from "react";
import PlayClient from "./PlayClient";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="container"><div className="card">Yuklanmoqda…</div></div>}>
      <PlayClient />
    </Suspense>
  );
}