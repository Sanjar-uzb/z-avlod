import { Suspense } from "react";
import ClientCrossword from "./ClientCrossword";

export default function AiKrosvordPlay() {
  return (
    <Suspense fallback={<div className="container"><section className="card"><p>Yuklanmoqda...</p></section></div>}>
      <ClientCrossword />
    </Suspense>
  );
}
