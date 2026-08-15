export type EducatorTabId =
  | "overview"
  | "students"
  | "questions"
  | "learning-content";

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
  fullName: string;
  needsAttention: boolean;
  overallPercent: number;
  practiceQuizPercent: number;
  practiceAttemptCount: number;
  timeSpentLabel: string;
  cheatAccessCount: number;
  improvementLabel: string;
  cognitiveLevels: EducatorStudentCognitiveLevel[];
  interventionLabels: string[];
};

export type EducatorQuestionFormat = "multiple-choice";

export type EducatorQuestion = {
  id: string;
  prompt: string;
  format: EducatorQuestionFormat;
  bloomLevel: string;
  difficulty: string;
  sectionName: string;
  quizTypes: string[];
  points: number;
  questionDataJson: string;
  answerDataJson: string;
  isActive: boolean;
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
