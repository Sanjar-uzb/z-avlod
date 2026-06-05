import { Suspense } from "react";
import MethodClient from "./MethodClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card">
            <div className="h2">Yuklanmoqda...</div>
            <p className="muted">Metod tayyorlanmoqda.</p>
          </div>
        </div>
      }
    >
      <MethodClient />
    </Suspense>
  );
}
