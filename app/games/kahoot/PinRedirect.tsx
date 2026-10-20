"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PinRedirect() {
  const sp = useSearchParams();
  const router = useRouter();
  const pin = sp.get("pin");

  useEffect(() => {
    if (!pin) return;
    router.replace(`/games/kahoot/join/?pin=${encodeURIComponent(pin)}`);
  }, [pin, router]);

  return null;
}
