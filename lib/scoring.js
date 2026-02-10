export function scoreQuiz(quiz, answersByQid) {
  let score = 0;
  const total = quiz.questions.length;

  for (const q of quiz.questions) {
    const picked = Number(answersByQid[q.id] || 0);
    if (picked && picked === q.correctChoiceId) score += 1;
  }

  const percent = total ? Math.round((score / total) * 100) : 0;
  return { score, total, percent };
}

export function levelFromPercent(p) {
  if (p >= 90) return { title: "A’lo", cls: "success" };
  if (p >= 70) return { title: "Yaxshi", cls: "success" };
  if (p >= 50) return { title: "Qoniqarli", cls: "warn" };
  return { title: "Qayta urinib ko‘ring", cls: "danger" };
}
