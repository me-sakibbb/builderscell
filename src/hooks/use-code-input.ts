import { useEffect, useRef, useState } from "react";

/**
 * State for a row of single-digit boxes: typing or pasting fills forward, backspace walks back.
 * With `autoSubmit`, the surrounding form submits once every box is filled - from an effect, so
 * the form reads the committed value rather than the one before the last keystroke.
 */
export function useCodeInput(length: number, autoSubmit = false) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const complete = digits.every(Boolean);

  useEffect(() => {
    if (autoSubmit && complete) boxes.current[0]?.form?.requestSubmit();
  }, [autoSubmit, complete]);

  const write = (index: number, value: string) => {
    const chars = value.replace(/\D/g, "").split("");
    if (!chars.length) return;

    const filled = [...digits];
    for (let i = 0; i < chars.length && index + i < length; i++) filled[index + i] = chars[i];
    setDigits(filled);

    const nextEmpty = filled.findIndex((d, i) => i >= index && !d);
    boxes.current[nextEmpty === -1 ? length - 1 : nextEmpty]?.focus();
  };

  const erase = (index: number) => {
    const filled = [...digits];
    if (filled[index]) filled[index] = "";
    else if (index > 0) {
      filled[index - 1] = "";
      boxes.current[index - 1]?.focus();
    }
    setDigits(filled);
  };

  const clear = () => {
    setDigits(Array(length).fill(""));
    boxes.current[0]?.focus();
  };

  return { digits, boxes, complete, value: digits.join(""), write, erase, clear };
}

export type CodeInputState = ReturnType<typeof useCodeInput>;
