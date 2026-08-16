"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type QuizProgressContextValue = {
  isQuizInProgress: boolean;
  setQuizInProgress: (value: boolean) => void;
};

const QuizProgressContext = createContext<QuizProgressContextValue>({
  isQuizInProgress: false,
  setQuizInProgress: () => {},
});

export function QuizProgressProvider({ children }: { children: ReactNode }) {
  const [isQuizInProgress, setQuizInProgress] = useState(false);

  return (
    <QuizProgressContext.Provider value={{ isQuizInProgress, setQuizInProgress }}>
      {children}
    </QuizProgressContext.Provider>
  );
}

export function useQuizProgress(): QuizProgressContextValue {
  return useContext(QuizProgressContext);
}
