"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { QuestionMarkIcon } from "@/components/icons/QuestionMarkIcon";

type ExplainTipProps = Readonly<{
  label: string;
  children: ReactNode;
  align?: "start" | "end";
}>;

export function ExplainTip({
  label,
  children,
  align = "end",
}: ExplainTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (isOpen === false) {
      return;
    }

    function close() {
      setIsOpen(false);
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      if (event.target instanceof Node && root.contains(event.target)) {
        return;
      }
      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <span ref={rootRef} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border-ui bg-surface text-text-secondary hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <QuestionMarkIcon className="size-3.5" />
      </button>
      {isOpen === false ? undefined : (
        <div
          id={panelId}
          role="note"
          className={`absolute top-full z-40 mt-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border-ui bg-surface p-3 text-left text-xs font-normal leading-relaxed text-text-secondary shadow-[0_12px_32px_rgba(30,27,51,0.16)] ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </span>
  );
}
