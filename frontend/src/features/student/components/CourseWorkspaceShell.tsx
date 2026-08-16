"use client";

import type { ReactNode } from "react";
import { CourseWorkspaceHeader } from "./CourseWorkspaceHeader";
import { QuizProgressProvider } from "./QuizProgressContext";

type CourseWorkspaceShellProps = {
  courseId: string;
  children: ReactNode;
};

export function CourseWorkspaceShell({
  courseId,
  children,
}: CourseWorkspaceShellProps) {
  return (
    <QuizProgressProvider>
      <CourseWorkspaceHeader courseId={courseId} />
      {children}
    </QuizProgressProvider>
  );
}
