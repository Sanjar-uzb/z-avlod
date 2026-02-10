import { Suspense } from "react";
import PlayClient from "./PlayClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card">
            <div className="h2">Yuklanmoqda...</div>
            <p className="muted">O‘yin boshlanmoqda.</p>
          </div>
        </div>
      }
    >
      <PlayClient />
    </Suspense>
  );
}
