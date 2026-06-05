import { Suspense } from "react";
import LabsIndexClient from "./labsindexclient";
import PageHero from "@/components/PageHero";

export default function LabsPage() {
  return (
    <>
      <div className="container" style={{ marginTop: 14 }}>
        <PageHero
          title="3D laboratoriyalar"
          subtitle="Fan bo‘yicha interaktiv laboratoriyalar. Fizika, kimyo, biologiya va informatika mashg‘ulotlariga kirib boring."
          badges={["3D", "Interaktiv", "Ta’lim"]}
        />
      </div>
      <Suspense
        fallback={
          <div className="container">
            <div className="card">
              <div className="h2">3D laboratoriyalar</div>
              <p className="muted" style={{ marginTop: 6 }}>
                Yuklanmoqda...
              </p>
            </div>
          </div>
        }
      >
        <LabsIndexClient />
      </Suspense>
    </>
  );
}