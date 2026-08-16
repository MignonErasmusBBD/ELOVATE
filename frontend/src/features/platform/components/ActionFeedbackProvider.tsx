"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Spinner } from "@/components/ui/Spinner";

type ActionFeedbackTone = "success" | "error" | "progress";

type ActionFeedback = {
  id: number;
  message: string;
  tone: ActionFeedbackTone;
};

type ActionFeedbackContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showProgress: (message: string) => void;
};

const ActionFeedbackContext = createContext<
  ActionFeedbackContextValue | undefined
>(undefined);

function feedbackToneClassName(tone: ActionFeedbackTone): string {
  if (tone === "error") {
    return "border-coral/30 bg-coral text-white";
  }
  if (tone === "progress") {
    return "border-border-ui bg-ink text-white";
  }
  return "border-emerald-600 bg-emerald-700 text-white";
}

function FeedbackIcon({
  tone,
}: Readonly<{ tone: ActionFeedbackTone }>) {
  if (tone === "progress") {
    return <Spinner className="size-4 shrink-0" />;
  }
  if (tone === "error") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="7.5" />
        <path d="M7 7 13 13M13 7 7 13" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.5 10.5 8.8 12.8 13.5 7.5" />
    </svg>
  );
}

export function ActionFeedbackProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [feedback, setFeedback] = useState<ActionFeedback | undefined>();

  const showSuccess = useCallback((message: string) => {
    setFeedback({
      id: Date.now(),
      message,
      tone: "success",
    });
  }, []);

  const showError = useCallback((message: string) => {
    setFeedback({
      id: Date.now(),
      message,
      tone: "error",
    });
  }, []);

  const showProgress = useCallback((message: string) => {
    setFeedback({
      id: Date.now(),
      message,
      tone: "progress",
    });
  }, []);

  useEffect(() => {
    if (feedback === undefined || feedback.tone === "progress") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setFeedback(undefined);
    }, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const providerValue = useMemo(
    () => ({ showSuccess, showError, showProgress }),
    [showError, showProgress, showSuccess],
  );

  return (
    <ActionFeedbackContext.Provider value={providerValue}>
      {children}
      {feedback === undefined ? undefined : (
        <aside
          key={feedback.id}
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end"
        >
          {feedback.tone === "error" ? (
            <p
              role="alert"
              className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_12px_32px_rgba(30,27,51,0.2)] ${feedbackToneClassName(feedback.tone)}`}
            >
              <FeedbackIcon tone={feedback.tone} />
              <span>{feedback.message}</span>
            </p>
          ) : (
            <output
              className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_12px_32px_rgba(30,27,51,0.2)] ${feedbackToneClassName(feedback.tone)}`}
            >
              <FeedbackIcon tone={feedback.tone} />
              <span>{feedback.message}</span>
            </output>
          )}
        </aside>
      )}
    </ActionFeedbackContext.Provider>
  );
}

export function useActionFeedback(): ActionFeedbackContextValue {
  const context = useContext(ActionFeedbackContext);
  if (context === undefined) {
    return {
      showSuccess: () => undefined,
      showError: () => undefined,
      showProgress: () => undefined,
    };
  }
  return context;
}
