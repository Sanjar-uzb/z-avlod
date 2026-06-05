import { Suspense } from "react";
import JoinClient from "./JoinClient";

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="container"><div className="card">Yuklanmoqda…</div></div>}>
      <JoinClient />
    </Suspense>
  );
}