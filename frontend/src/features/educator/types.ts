export type EducatorTabId =
  | "overview"
  | "students"
  | "questions"
  | "learning-content"
  | "practice-insights";

export type EducatorCourseVisibility = "community" | "private";

export type BloomCoveragePoint = {
  levelName: string;
  coverageCount: number;
  performancePercent: number;
};

export type QuestionSectionStat = {
  sectionName: string;
  questionCount: number;
};

export type BloomDifficultyStat = {
  levelName: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
};

export type InterventionRuleFlag = {
  ruleLabel: string;
  flaggedStudentCount: number;
};

export type EducatorStudentCognitiveLevel = {
  levelName: string;
  percentCorrect: number;
  questionCount: number;
};

export type EducatorStudentSummary = {
  id: string;
  enrollmentId: string;
  userId: string;
  fullName: string;
  emailAddress: string;
  status: "active" | "completed" | "withdrawn";
  enrolledAtLabel: string;
  needsAttention: boolean;
  overallPercent?: number;
  practiceQuizPercent?: number;
  practiceAttemptCount?: number;
  timeSpentLabel?: string;
  cheatAccessCount?: number;
  improvementLabel?: string;
  isRequired: boolean;
  cognitiveLevels: EducatorStudentCognitiveLevel[];
  interventionLabels: string[];
};

export type EducatorQuestionOption = {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
};

export type EducatorQuestion = {
  id: string;
  prompt: string;
  correctReason: string | undefined;
  formatCode: string;
  questionFormatId: number;
  bloomLevelId: number;
  bloomLevelName: string;
  difficultyLevelId: number;
  difficultyName: string;
  courseSectionId: string;
  sectionTitle: string;
  status: "active" | "deactivated";
  baseDifficulty: number;
  options: EducatorQuestionOption[];
};

export type LearningContentBlock = {
  id: string;
  contentType: "text" | "code";
  bodyText: string;
  position: number;
};

export type LearningContentSection = {
  id: string;
  title: string;
  position: number;
  contentBlocks: LearningContentBlock[];
};

export type EducatorCourseDashboard = {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averagePracticeQuizPercent: number;
  bloomCoverage: BloomCoveragePoint[];
  questionSections: QuestionSectionStat[];
  bloomDifficulty: BloomDifficultyStat[];
  interventionRuleFlags: InterventionRuleFlag[];
  students: EducatorStudentSummary[];
  questions: EducatorQuestion[];
  learningContentSections: LearningContentSection[];
};
