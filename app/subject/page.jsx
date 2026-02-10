import { Suspense } from "react";
import SubjectClient from "./SubjectClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card">
            <div className="h2">Yuklanmoqda...</div>
            <p className="muted">Fan ma’lumotlari tayyorlanmoqda.</p>
          </div>
        </div>
      }
    >
      <SubjectClient />
    </Suspense>
  );
}
