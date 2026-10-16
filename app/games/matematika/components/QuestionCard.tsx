"use client";

import { useEffect, useRef } from "react";
import type { MathQuestion } from "../types";
import AnswerInput from "./AnswerInput";

export interface QuestionFeedback {
  status: "correct" | "wrong";
  text: string;
  detail?: string;
}

export interface QuestionCardProps {
  question?: MathQuestion;
  index: number;
  total: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  awaitingNext: boolean;
  isLast: boolean;
  disabled?: boolean;
  feedback: QuestionFeedback | null;
  correct: number;
  wrong: number;
  accuracy: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "OSON",
  medium: "O'RTA",
  hard: "QIYIN",
};

export default function QuestionCard({
  question,
  index,
  total,
  answer,
  onAnswerChange,
  onSubmit,
  onNext,
  awaitingNext,
  isLast,
  disabled = false,
  feedback,
  correct,
  wrong,
  accuracy,
}: QuestionCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const activeNumber = Math.min(index + 1, total);

  useEffect(() => {
    if (awaitingNext) {
      nextRef.current?.focus();
    } else if (!disabled) {
      inputRef.current?.focus();
    }
  }, [index, awaitingNext, disabled]);

  return (
    <section className="math-race-question" aria-label="Savol va javob">
      <div className="math-race-question-top">
        <span className="math-race-question-index">
          SAVOL {activeNumber} / {total}
        </span>
        <span className={`math-race-difficulty difficulty-${question?.difficulty ?? "easy"}`}>
          {`QIYINLIK: ${DIFFICULTY_LABEL[question?.difficulty ?? "easy"] ?? "OSON"}`}
        </span>
      </div>

      <p className="math-race-question-text">{question?.question ?? "Savol yuklanmoqda..."}</p>

      {awaitingNext ? (
        <button
          ref={nextRef}
          type="button"
          className="math-race-next"
          onClick={onNext}
        >
          {isLast ? "NATIJANI KO'RISH →" : "KEYINGI SAVOL →"}
        </button>
      ) : (
        <AnswerInput
          ref={inputRef}
          value={answer}
          onChange={onAnswerChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      )}

      <div className="math-race-question-foot">
        <div className="math-race-stats">
          <span className="math-race-stat stat-correct">{`To'g'ri: ${correct}`}</span>
          <span className="math-race-stat stat-wrong">{`Noto'g'ri: ${wrong}`}</span>
          <span className="math-race-stat stat-accuracy">{`Aniqlik: ${accuracy}`}</span>
        </div>

        {feedback ? (
          <p
            className={`math-race-feedback${feedback.status === "correct" ? " is-correct" : " is-wrong"}`}
            role="status"
          >
            <span>
              {feedback.status === "correct" ? "✓" : "✗"} {feedback.text}
            </span>
            {feedback.detail ? <small>{feedback.detail}</small> : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
