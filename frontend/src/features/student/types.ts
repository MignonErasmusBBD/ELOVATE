export type LessonViewMode = "sub-tabs" | "full-page";

export type LessonUnit = {
  id: string;
  title: string;
  paragraphs: string[];
  codeSample?: string;
  exercises?: string[];
};

export type QuizPhase = "start" | "question" | "score";

export type QuizOptionId = "A" | "B" | "C" | "D";

export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export type QuizOption = {
  id: QuizOptionId;
  label: string;
};

export type PracticeQuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: QuizOptionId;
  explanation: string;
  topic: string;
  bloomLevel: string;
  difficulty: QuizDifficulty;
};

export type PracticeQuiz = {
  courseId: string;
  questions: PracticeQuizQuestion[];
};

export type DashboardStatusVariant =
  | "completed"
  | "intervention"
  | "failed";

export type DashboardStatusBanner = {
  variant: DashboardStatusVariant;
  title: string;
  message: string;
};

export type DashboardMetricId =
  | "improvement"
  | "practiceQuiz"
  | "timeSpent";

export type DashboardMetric = {
  id: DashboardMetricId;
  label: string;
  value: string;
  accentClassName: string;
};

export type CognitiveLevelPerformance = {
  levelName: string;
  percentCorrect: number;
  questionCount: number;
};

export type PracticeQuizAttempt = {
  id: string;
  attemptLabel: string;
  scorePercent: number;
  completedAt: string;
};

export type StudentDashboardSummary = {
  courseId: string;
  courseTitle: string;
  studentEmailAddress: string;
  statusBanners: DashboardStatusBanner[];
  metrics: DashboardMetric[];
  cognitiveLevelPerformance: CognitiveLevelPerformance[];
  practiceQuizAttempts: PracticeQuizAttempt[];
  recommendations: string[];
};

