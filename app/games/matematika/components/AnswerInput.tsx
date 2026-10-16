"use client";

import { forwardRef } from "react";

export interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const AnswerInput = forwardRef<HTMLInputElement, AnswerInputProps>(function AnswerInput(
  { value, onChange, onSubmit, disabled = false, placeholder = "Javobingizni yozing..." },
  ref,
) {
  return (
    <div className="math-race-answer">
      <input
        ref={ref}
        className="math-race-answer-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        aria-label="Javob"
      />
      <button
        type="button"
        className="math-race-answer-btn"
        onClick={onSubmit}
        disabled={disabled || value.trim().length === 0}
      >
        JAVOB BERISH
      </button>
    </div>
  );
});

export default AnswerInput;
