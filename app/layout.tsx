import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Z-avlod platformasi",
  description:
    "Z avlod vakillari bilan olib boriladigan zamonaviy ta’lim va tarbiya metodlari bo‘yicha interaktiv platforma.",
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
                  <span>Ta’lim va tarbiya metodlari platformasi</span>
                </span>
              </Link>

              <nav className="nav" aria-label="Asosiy menyu">
                <Link href="/start">Boshlash</Link>
                <Link href="/methods">Metodlar</Link>
                <Link href="/quiz">Test</Link>
                <Link href="/reflections">Refleksiya</Link>
                <Link href="/profile">Profil</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="main">
          {children}
        </main>

        <footer className="footer">
          <div className="container">
            <div className="footerRow">
              <div className="muted">
                © {new Date().getFullYear()} Z-avlod. GitHub Pages (static export) uchun tayyorlangan.
              </div>
              <div className="row">
                <a href="https://github.com/sanjar-uzb/z-avlod" target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <span className="muted">•</span>
                <a href="/" >
                  Bosh sahifa
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
