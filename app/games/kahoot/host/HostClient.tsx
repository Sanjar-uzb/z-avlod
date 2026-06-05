"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { parseKahootTxt } from "@/lib/kahootText";
import { createRoom } from "@/lib/kahootLive";

async function parseDocxFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("text");

  if (!docXml) {
    throw new Error("word/document.xml topilmadi");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, "application/xml");
  const paragraphs = Array.from(xmlDoc.getElementsByTagName("w:p")).map((p) => {
    const texts = Array.from(p.getElementsByTagName("w:t")).map((t) => t.textContent || "");
    return texts.join("");
  });

  return paragraphs.join("\n\n");
}

export default function HostClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("Kahoot Live");
  const [timeSec, setTimeSec] = useState(15);

  const [txt, setTxt] = useState(`# 12 × 8 = ?
- 86
+ 96
- 108
- 88

# H2O — bu nima?
- Kislorod
+ Suv
- Vodorod
- Karbonat angidrid
`);

  const parsed = useMemo(() => parseKahootTxt(txt), [txt]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        if (file.name.toLowerCase().endsWith(".docx")) {
          const arrayBuffer = reader.result as ArrayBuffer;
          const text = await parseDocxFromBuffer(arrayBuffer);
          setTxt(text);
        } else {
          const text = String(reader.result || "");
          setTxt(text);
        }
      } catch (error: any) {
        setErr(`DOCX parse xatosi: ${error?.message || "Noma'lum"}`);
      }
    };

    if (file.name.toLowerCase().endsWith(".docx")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, "UTF-8");
    }
  }

  async function create() {
    setErr("");

    if (!parsed.ok) {
      setErr(parsed.error);
      return;
    }

    setBusy(true);

    try {
      const pin = await createRoom({
        title,
        timePerQuestionSec: timeSec,
        questions: parsed.questions,
      });

      router.push(`/games/kahoot/play?pin=${pin}&role=host`);
    } catch (e: any) {
      setErr(e?.message || "Room yaratishda xatolik");
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="h2">O‘qituvchi (Host)</div>
        <p className="muted" style={{ marginTop: 6 }}>
          Bloknotda yozilgan testni TXT fayl qilib yuklang yoki pastdagi oynaga qo‘ying.
        </p>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">O‘yin nomi</div>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="card" style={{ gridColumn: "span 6" }}>
            <div className="h3">Har savol vaqti (sekund)</div>
            <input
              className="input"
              type="number"
              min="5"
              max="60"
              value={timeSec}
              onChange={(e) => setTimeSec(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="h3" style={{ marginTop: 12 }}>TXT/DOCX import (# + -)</div>

        <input
          type="file"
          accept=".txt,.docx"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileImport}
        />

        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn btnGhost"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            TXT Import
          </button>
        </div>

        <textarea
          className="input"
          style={{ minHeight: 280, marginTop: 12 }}
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
        />

        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn"
            onClick={create}
            disabled={busy || !parsed.ok}
          >
            {busy ? "PIN yaratilmoqda..." : "PIN yaratish"}
          </button>

          <Link className="btn btnGhost" href="/games/kahoot/join">
            O‘quvchi sahifasi
          </Link>
        </div>

        {!parsed.ok && (
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,107,107,.35)" }}>
            <div className="h3">Xatolik</div>
            <div className="muted">{parsed.error}</div>
          </div>
        )}

        {err && (
          <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,107,107,.35)" }}>
            <div className="h3">Xatolik</div>
            <div className="muted">{err}</div>
          </div>
        )}
      </div>
    </div>
  );
}