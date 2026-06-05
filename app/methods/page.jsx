"use client";

import Link from "next/link";

export default function Methods() {
  const sections = [
    {
      title: "O'qituvchi uchun metodlar",
      description:
        "Darsni tashkil qilish, metod tanlash, refleksiya va mini-quiz orqali baholash uchun metodik katalog.",
      href: "/methods/teacher",
      buttonLabel: "O'qituvchi bo'limi",
      badge: "Metodik katalog",
    },
    {
      title: "O'quvchi uchun metodlar",
      description:
        "O'quvchilar uchun soddaroq, amaliy va bosqichma-bosqich ishlatiladigan metodlar jamlangan bo'lim.",
      href: "/methods/student",
      buttonLabel: "O'quvchi bo'limi",
      badge: "So'rovnoma va tahlil",
    },
  ];

  return (
    <div className="container">
      <div className="card">
        <div className="h2">Metodlar bo&apos;limi</div>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
          O&apos;qituvchi va o&apos;quvchi uchun alohida yo&apos;nalishlar bir joyda jamlangan.
          Kerakli bo&apos;limni tanlab, bevosita ish jarayoniga o&apos;tasiz.
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {sections.map((section) => (
          <div
            className="card"
            key={section.href}
            style={{
              gridColumn: "span 6",
            }}
          >
            <div>
              <div className="row">
                <span className="badge">
                  {section.badge}
                </span>
              </div>

              <div className="h2" style={{ marginTop: 14 }}>
                {section.title}
              </div>

              <p className="muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
                {section.description}
              </p>
            </div>

            <div className="row" style={{ marginTop: 18 }}>
              <Link
                className="btn"
                href={section.href}
              >
                {section.buttonLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
