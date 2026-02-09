import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <section className="card hero">
        <div className="badgeRow">
          <span className="badge">Web-platforma (MVP)</span>
          <span className="badge">Z avlod</span>
          <span className="badge">Interaktiv metodlar</span>
          <span className="badge">Refleksiya + test</span>
        </div>

        <h1 className="heroTitle">
          Z AVLOD VAKILLARI BILAN OLIB BORILADIGAN ZAMONAVIY TA’LIM VA TARBIYA METODLARI
        </h1>

        <p className="heroSubtitle">
          Ushbu platforma Z avlod o‘quvchilarining raqamli muhitdagi ehtiyojlariga mos metodlarni jamlaydi:
          shaxsga yo‘naltirilgan yondashuv, kompetensiyaviy ta’lim, loyiha va keyslar, gamifikatsiya,
          interaktiv hamda adaptiv metodlar.
        </p>

        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn" href="/start">Boshlash</Link>
          <Link className="btn btnGhost" href="/methods">Metodlar katalogi</Link>
          <Link className="btn btnGhost" href="/profile">Profil</Link>
        </div>

        <div className="heroNote">
          Registratsiyasiz: hozircha <span className="kbd">Ism/Familiya</span> kiritish kifoya.
          Natijalar va refleksiya shu qurilmada saqlanadi.
        </div>
      </section>

      <section className="grid" style={{ marginTop: 14 }}>
        <div className="card" style={{ gridColumn: "span 6" }}>
          <div className="h2">Tadqiqot maqsadi</div>
          <p className="muted">
            Z avlod vakillari bilan ishlashda zamonaviy ta’lim va tarbiya metodlarini platforma ko‘rinishida
            tizimlashtirish hamda amaliy qo‘llash mexanizmini ko‘rsatish.
          </p>

          <hr className="hr" />

          <div className="h2">Tadqiqot vazifalari</div>
          <ul className="bul">
            <li>Metodlarni toifalash va yagona katalogga jamlash.</li>
            <li>Har bir metod uchun qadam-baqadam qo‘llash tartibini berish.</li>
            <li>Interaktiv amaliyot: mini-quiz va refleksiya mexanizmini joriy etish.</li>
            <li>Natijalarni kuzatish (local progress) va tahlil qilish imkonini yaratish.</li>
          </ul>
        </div>

        <div className="card" style={{ gridColumn: "span 6" }}>
          <div className="h2">Platforma modullari</div>

          <div className="moduleList">
            <div className="module">
              <div className="moduleTitle">1) Metodlar katalogi</div>
              <div className="muted">
                8 ta metod bo‘limi: shaxsga yo‘naltirilgan, kompetensiya, loyiha, keys,
                gamifikatsiya, raqamli ta’lim, interaktiv, adaptiv.
              </div>
            </div>

            <div className="module">
              <div className="moduleTitle">2) Interaktiv amaliyot</div>
              <div className="muted">Har metodga mos mini-quiz va tezkor natija.</div>
            </div>

            <div className="module">
              <div className="moduleTitle">3) Refleksiya</div>
              <div className="muted">Refleksiya savollari + matn saqlash (portfolio).</div>
            </div>

            <div className="module">
              <div className="moduleTitle">4) Profil</div>
              <div className="muted">Ism/Familiya, sinf/guruh (ixtiyoriy) va natijalar tarixi.</div>
            </div>
          </div>

          <hr className="hr" />

          <div className="row">
            <Link className="btn" href="/methods">Metodlarni ko‘rish</Link>
            <Link className="btn btnGhost" href="/reflections">Refleksiyalar</Link>
          </div>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 14 }}>
        <div className="card" style={{ gridColumn: "span 7" }}>
          <div className="h2">Metodologik yondashuv</div>
          <p className="muted">
            Platforma metodlar katalogi, interaktiv topshiriqlar va refleksiya orqali o‘quvchi faolligini oshirish,
            tezkor feedback berish hamda o‘z-o‘zini baholash elementlarini kuchaytirishga xizmat qiladi.
          </p>

          <div className="pillGrid">
            <span className="pill2">Tezkor feedback</span>
            <span className="pill2">Vizual/raqamli kontent</span>
            <span className="pill2">Amaliy vaziyatlar (keys)</span>
            <span className="pill2">Gamifikatsiya</span>
            <span className="pill2">Refleksiya</span>
            <span className="pill2">Moslashuvchan (adaptiv)</span>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "span 5" }}>
          <div className="h2">Kutilayotgan natijalar</div>
          <ul className="bul">
            <li>Metodlarni amaliy qo‘llash bo‘yicha aniq yo‘riqnoma.</li>
            <li>O‘quvchi faolligi va motivatsiyasining oshishi.</li>
            <li>Test + refleksiya orqali o‘zlashtirishni mustahkamlash.</li>
            <li>Pedagog uchun metod tanlashda qulay katalog.</li>
          </ul>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="h2">Boshlash</div>
        <p className="muted">
          Avval ism-familiyangizni kiriting, so‘ng metod tanlab o‘qing, refleksiya yozing va mini-quiz yeching.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn" href="/start">Ism/Familiya kiritish</Link>
          <Link className="btn btnGhost" href="/methods">Metodlar katalogi</Link>
        </div>
      </section>
    </div>
  );
}
