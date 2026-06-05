"use client";

import Link from "next/link";

const subjects = [
  { name: "Fizika", href: "/labs?fan=fizika" },
  { name: "Kimyo", href: "/labs?fan=kimyo" },
  { name: "Biologiya", href: "/labs?fan=biologiya" },
  { name: "Informatika", href: "/labs?fan=informatika" },
];

export default function SubjectNav() {
  return (
    <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
      {subjects.map((subject) => (
        <Link key={subject.href} className="btn btnGhost" href={subject.href}>
          {subject.name}
        </Link>
      ))}
    </div>
  );
}
