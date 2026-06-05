import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Z-avlod platformasi",
  description:
    "Z avlod vakillari bilan olib boriladigan zamonaviy talim va tarbiya metodlari boyicha interaktiv platforma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <header className="header">
          <div className="container">
            <div className="headerRow">
              <Link className="brand" href="/">
                <span className="brandMark" aria-hidden="true" />
                <span className="brandText">
                  <b>Z-avlod</b>
                  <span>Talim va tarbiya metodlari platformasi</span>
                </span>
              </Link>

              <nav className="nav" aria-label="Asosiy menyu">
                <Link href="/methods">Metodlar</Link>
                <Link href="/games">O'yinlar</Link>
                <Link href="/reflections">Refleksiya</Link>
                <Link href="/profile">Profil</Link>
                <Link href="/subjects">Test</Link>
                <Link href="/labs">3D laboratoriyalar</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="main">{children}</main>

        <footer className="footer">
          <div className="container">
            <div className="footerRow">
              <div className="muted">
                {new Date().getFullYear()} Z-avlod. GitHub Pages (static export) uchun tayyorlangan.
              </div>
              <div className="row">
                <a href="https://github.com/sanjar-uzb/z-avlod" target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <span className="muted">•</span>
                <Link href="/">Bosh sahifa</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
