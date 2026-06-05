import { Suspense } from "react";
import QuizClient from "./QuizClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="card">
            <div className="h2">Yuklanmoqda...</div>
            <p className="muted">Test tayyorlanmoqda.</p>
          </div>
        </div>
      }
    >
      <QuizClient />
    </Suspense>
  );
}
