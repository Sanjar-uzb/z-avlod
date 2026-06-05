import Link from "next/link";

export default function BackButton({ href = "/labs" }: { href?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Link href={href} className="btn btnGhost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        ← Ortga
      </Link>
    </div>
  );
}
