import { Suspense } from "react";
import HostClient from "./HostClient";

export default function HostPage() {
  return (
    <Suspense fallback={<div className="container"><div className="card">Yuklanmoqda…</div></div>}>
      <HostClient />
    </Suspense>
  );
}