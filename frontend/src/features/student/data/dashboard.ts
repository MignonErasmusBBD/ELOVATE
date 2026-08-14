import type {
  PracticeQuizAttempt,
  StudentDashboardSummary,
} from "../types";

const practiceQuizAttempts: PracticeQuizAttempt[] = [
  { id: "a1", attemptLabel: "1 May", scorePercent: 30, completedAt: "2026-05-01" },
  { id: "a2", attemptLabel: "4 May", scorePercent: 35, completedAt: "2026-05-04" },
  { id: "a3", attemptLabel: "7 May", scorePercent: 28, completedAt: "2026-05-07" },
  { id: "a4", attemptLabel: "10 May", scorePercent: 40, completedAt: "2026-05-10" },
  { id: "a5", attemptLabel: "13 May", scorePercent: 42, completedAt: "2026-05-13" },
  { id: "a6", attemptLabel: "16 May", scorePercent: 38, completedAt: "2026-05-16" },
  { id: "a7", attemptLabel: "19 May", scorePercent: 45, completedAt: "2026-05-19" },
  { id: "a8", attemptLabel: "22 May", scorePercent: 48, completedAt: "2026-05-22" },
  { id: "a9", attemptLabel: "25 May", scorePercent: 52, completedAt: "2026-05-25" },
  { id: "a10", attemptLabel: "28 May", scorePercent: 50, completedAt: "2026-05-28" },
  { id: "a11", attemptLabel: "1 Jun", scorePercent: 55, completedAt: "2026-06-01" },
  { id: "a12", attemptLabel: "4 Jun", scorePercent: 58, completedAt: "2026-06-04" },
  { id: "a13", attemptLabel: "7 Jun", scorePercent: 54, completedAt: "2026-06-07" },
  { id: "a14", attemptLabel: "10 Jun", scorePercent: 62, completedAt: "2026-06-10" },
  { id: "a15", attemptLabel: "14 Jun", scorePercent: 65, completedAt: "2026-06-14" },
  { id: "a16", attemptLabel: "18 Jun", scorePercent: 60, completedAt: "2026-06-18" },
  { id: "a17", attemptLabel: "22 Jun", scorePercent: 68, completedAt: "2026-06-22" },
  { id: "a18", attemptLabel: "26 Jun", scorePercent: 72, completedAt: "2026-06-26" },
  { id: "a19", attemptLabel: "1 Jul", scorePercent: 70, completedAt: "2026-07-01" },
  { id: "a20", attemptLabel: "8 Jul", scorePercent: 75, completedAt: "2026-07-08" },
  { id: "a21", attemptLabel: "14 Jul", scorePercent: 80, completedAt: "2026-07-14" },
];

/** Placeholder course-scoped practice performance for the current student. */
export function getStudentDashboardSummary(
  courseId: string,
  courseTitle: string,
  studentEmailAddress: string,
): StudentDashboardSummary {
  return {
    courseId,
    courseTitle,
    studentEmailAddress,
    statusBanners: [
      {
        variant: "completed",
        title: "Congratulations!",
        message: `You have completed the ${courseTitle} practice quizzes.`,
      },
      {
        variant: "intervention",
        title: "Congratulations!",
        message: `You have completed the ${courseTitle} module — there is some intervention needed.`,
      },
      {
        variant: "failed",
        title: "Failed",
        message: `You have not completed the ${courseTitle} module. A retake is needed.`,
      },
    ],
    metrics: [
      {
        id: "improvement",
        label: "Improvement",
        value: "+45%",
        accentClassName: "border-l-coral text-coral",
      },
      {
        id: "practiceQuiz",
        label: "Practice Quiz",
        value: "45%",
        accentClassName: "border-l-emerald-600 text-emerald-700",
      },
      {
        id: "timeSpent",
        label: "Time Spent",
        value: "4.5h",
        accentClassName: "border-l-sky-600 text-sky-700",
      },
    ],
    cognitiveLevelPerformance: [
      { levelName: "Remember", percentCorrect: 90, questionCount: 12 },
      { levelName: "Understand", percentCorrect: 80, questionCount: 12 },
      { levelName: "Apply", percentCorrect: 90, questionCount: 12 },
      { levelName: "Analyze", percentCorrect: 50, questionCount: 12 },
      { levelName: "Evaluate", percentCorrect: 60, questionCount: 12 },
      { levelName: "Create", percentCorrect: 15, questionCount: 12 },
    ],
    practiceQuizAttempts,
    recommendations: [
      `Spend more practice time on Analyze and Create questions in ${courseTitle}.`,
      "Revisit lesson Explanation and Exercise units before your next quiz.",
      "Keep a steady practice cadence — your recent attempts show clear improvement.",
    ],
  };
}
