export type TxtQuestion = {
  id: number;
  text: string;
  choices: { id: number; text: string }[];
  answerId: number;
};

export function parseKahootTxt(
  input: string
): { ok: true; questions: TxtQuestion[] } | { ok: false; error: string } {
  const blocks = input
    .replace(/\r/g, "")
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);

  const questions: TxtQuestion[] = [];
  let qid = 1;

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 3) {
      return { ok: false, error: `Blok juda qisqa: "${block.slice(0, 40)}..."` };
    }

    const qLine = lines[0];
    if (!qLine.startsWith("#")) {
      return { ok: false, error: `Savol # bilan boshlansin: "${qLine}"` };
    }

    const qText = qLine.replace(/^#\s*/, "").trim();
    if (!qText) {
      return { ok: false, error: `Savol matni bo‘sh: "${qLine}"` };
    }

    const choiceLines = lines.slice(1);
    const choices: { id: number; text: string }[] = [];
    let answerId = 0;
    let cid = 1;

    for (const cl of choiceLines) {
      const isCorrect = cl.startsWith("+");
      const isWrong = cl.startsWith("-");

      if (!isCorrect && !isWrong) {
        return { ok: false, error: `Variant + yoki - bilan boshlansin: "${cl}"` };
      }

      const text = cl.replace(/^(\+|-)\s*/, "").trim();
      if (!text) {
        return { ok: false, error: `Variant matni bo‘sh: "${cl}"` };
      }

      choices.push({ id: cid, text });
      if (isCorrect) answerId = cid;
      cid++;
    }

    if (choices.length < 2) {
      return { ok: false, error: `Kamida 2 ta variant bo‘lsin: "${qText}"` };
    }

    if (!answerId) {
      return { ok: false, error: `To‘g‘ri javob (+) topilmadi: "${qText}"` };
    }

    questions.push({
      id: qid++,
      text: qText,
      choices,
      answerId,
    });
  }

  return { ok: true, questions };
}