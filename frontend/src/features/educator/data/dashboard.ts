import { courses } from "@/features/courses/data/courses";
import type { EducatorCourseDashboard } from "../types";

function buildDashboardForCourse(
  courseId: string,
  courseTitle: string,
): EducatorCourseDashboard {
  return {
    courseId,
    courseTitle,
    totalStudents: 18,
    averagePracticeQuizPercent: 75,
    bloomCoverage: [
      { levelName: "Remember", coverageCount: 107, performancePercent: 69 },
      { levelName: "Understand", coverageCount: 84, performancePercent: 72 },
      { levelName: "Apply", coverageCount: 96, performancePercent: 65 },
      { levelName: "Analyze", coverageCount: 58, performancePercent: 48 },
      { levelName: "Evaluate", coverageCount: 42, performancePercent: 55 },
      { levelName: "Create", coverageCount: 24, performancePercent: 32 },
    ],
    questionSections: [
      { sectionName: "Code Implementation", questionCount: 28 },
      { sectionName: "Pattern Participants/Relationships", questionCount: 22 },
      { sectionName: "Theory & Concepts", questionCount: 31 },
      { sectionName: "UML Diagrams", questionCount: 15 },
    ],
    bloomDifficulty: [
      { levelName: "Remember", easyCount: 40, mediumCount: 30, hardCount: 10 },
      { levelName: "Understand", easyCount: 25, mediumCount: 35, hardCount: 12 },
      { levelName: "Apply", easyCount: 18, mediumCount: 28, hardCount: 20 },
      { levelName: "Analyze", easyCount: 10, mediumCount: 22, hardCount: 24 },
      { levelName: "Evaluate", easyCount: 8, mediumCount: 18, hardCount: 16 },
      { levelName: "Create", easyCount: 4, mediumCount: 10, hardCount: 14 },
    ],
    interventionRuleFlags: [
      { ruleLabel: "Low practice average", flaggedStudentCount: 7 },
      { ruleLabel: "Low foundational bloom", flaggedStudentCount: 5 },
      { ruleLabel: "Low evaluate/create bloom", flaggedStudentCount: 9 },
      {
        ruleLabel: "Low topic confidence and performance",
        flaggedStudentCount: 4,
      },
    ],
    students: [
      {
        id: "student-a",
        enrollmentId: "enrollment-a",
        userId: "user-a",
        fullName: "Student A",
        emailAddress: "student.a@example.com",
        status: "active",
        enrolledAtLabel: "1 Jan 2026",
        needsAttention: true,
        overallPercent: 85,
        practiceQuizPercent: 55,
        practiceAttemptCount: 1,
        timeSpentLabel: "00:30:14",
        cheatAccessCount: 34,
        improvementLabel: "+12%",
        cognitiveLevels: [
          { levelName: "Remember", percentCorrect: 90, questionCount: 3 },
          { levelName: "Understand", percentCorrect: 80, questionCount: 3 },
          { levelName: "Apply", percentCorrect: 90, questionCount: 3 },
          { levelName: "Analyze", percentCorrect: 50, questionCount: 3 },
          { levelName: "Evaluate", percentCorrect: 60, questionCount: 3 },
          { levelName: "Create", percentCorrect: 15, questionCount: 3 },
        ],
        interventionLabels: [
          "Low Evaluate/Create Bloom",
          "Low Foundational Bloom",
        ],
      },
      {
        id: "student-b",
        enrollmentId: "enrollment-b",
        userId: "user-b",
        fullName: "Student B",
        emailAddress: "student.b@example.com",
        status: "active",
        enrolledAtLabel: "3 Jan 2026",
        needsAttention: false,
        overallPercent: 78,
        practiceQuizPercent: 45,
        practiceAttemptCount: 4,
        timeSpentLabel: "01:12:40",
        cheatAccessCount: 12,
        improvementLabel: "+45%",
        cognitiveLevels: [
          { levelName: "Remember", percentCorrect: 90, questionCount: 3 },
          { levelName: "Understand", percentCorrect: 80, questionCount: 3 },
          { levelName: "Apply", percentCorrect: 90, questionCount: 3 },
          { levelName: "Analyze", percentCorrect: 50, questionCount: 3 },
          { levelName: "Evaluate", percentCorrect: 60, questionCount: 3 },
          { levelName: "Create", percentCorrect: 15, questionCount: 3 },
        ],
        interventionLabels: [
          "Low Evaluate/Create Bloom",
          "Low Foundational Bloom",
        ],
      },
      {
        id: "student-c",
        enrollmentId: "enrollment-c",
        userId: "user-c",
        fullName: "Student C",
        emailAddress: "student.c@example.com",
        status: "active",
        enrolledAtLabel: "5 Jan 2026",
        needsAttention: true,
        overallPercent: 62,
        practiceQuizPercent: 40,
        practiceAttemptCount: 2,
        timeSpentLabel: "00:45:02",
        cheatAccessCount: 21,
        improvementLabel: "+8%",
        cognitiveLevels: [
          { levelName: "Remember", percentCorrect: 70, questionCount: 3 },
          { levelName: "Understand", percentCorrect: 65, questionCount: 3 },
          { levelName: "Apply", percentCorrect: 55, questionCount: 3 },
          { levelName: "Analyze", percentCorrect: 40, questionCount: 3 },
          { levelName: "Evaluate", percentCorrect: 35, questionCount: 3 },
          { levelName: "Create", percentCorrect: 10, questionCount: 3 },
        ],
        interventionLabels: ["Low Evaluate/Create Bloom"],
      },
    ],
    questions: [
      {
        id: "q-1",
        prompt: "What is the primary purpose of the Observer pattern?",
        formatCode: "mcq",
        questionFormatId: 1,
        bloomLevelId: 1,
        bloomLevelName: "Remember",
        difficultyLevelId: 1,
        difficultyName: "Easy",
        courseSectionId: "section-introduction",
        sectionTitle: "Introduction",
        status: "active",
        baseDifficulty: 0.3,
        options: [
          {
            id: "opt-1a",
            optionText: "Decouple subjects from dependents",
            isCorrect: true,
            position: 0,
          },
          {
            id: "opt-1b",
            optionText: "Create objects without specifying class",
            isCorrect: false,
            position: 1,
          },
          {
            id: "opt-1c",
            optionText: "Cache expensive results",
            isCorrect: false,
            position: 2,
          },
          {
            id: "opt-1d",
            optionText: "Enforce a single instance",
            isCorrect: false,
            position: 3,
          },
        ],
      },
      {
        id: "q-2",
        prompt: "How should observers attach to a subject at runtime?",
        formatCode: "mcq",
        questionFormatId: 1,
        bloomLevelId: 3,
        bloomLevelName: "Apply",
        difficultyLevelId: 2,
        difficultyName: "Medium",
        courseSectionId: "section-structure",
        sectionTitle: "Structure",
        status: "active",
        baseDifficulty: 0.5,
        options: [
          {
            id: "opt-2a",
            optionText: "Hard-code every listener in the subject",
            isCorrect: false,
            position: 0,
          },
          {
            id: "opt-2b",
            optionText: "Call attach/detach on the subject",
            isCorrect: true,
            position: 1,
          },
          {
            id: "opt-2c",
            optionText: "Restart the process for each listener",
            isCorrect: false,
            position: 2,
          },
          {
            id: "opt-2d",
            optionText: "Store observers only in localStorage",
            isCorrect: false,
            position: 3,
          },
        ],
      },
    ],
    learningContentSections: [
      {
        id: "section-introduction",
        title: "Introduction",
        position: 0,
        contentBlocks: [
          {
            id: "block-intro-1",
            contentType: "text",
            bodyText: `Welcome to ${courseTitle}. This section introduces the core ideas students will practice: how one object can notify many others when state changes, without tight coupling.`,
            position: 0,
          },
        ],
      },
      {
        id: "section-identification",
        title: "Identification",
        position: 1,
        contentBlocks: [
          {
            id: "block-id-1",
            contentType: "text",
            bodyText:
              "Students should recognise when a subject must tell several dependents about a change without hard-coding those dependents. Look for publish-subscribe relationships and event listeners.",
            position: 0,
          },
        ],
      },
      {
        id: "section-structure",
        title: "Structure",
        position: 2,
        contentBlocks: [
          {
            id: "block-structure-1",
            contentType: "text",
            bodyText:
              "Cover subject, concrete subject, observer, and concrete observer. Explain attach, detach, and notify with a short code sample when useful.",
            position: 0,
          },
          {
            id: "block-structure-2",
            contentType: "code",
            bodyText: `subject.attach(observer);
subject.notify();`,
            position: 1,
          },
        ],
      },
      {
        id: "section-exercise",
        title: "Exercise",
        position: 3,
        contentBlocks: [
          {
            id: "block-exercise-1",
            contentType: "text",
            bodyText:
              "Prompt students to name participants, describe notify behaviour, and sketch why a dashboard should subscribe instead of being called directly.",
            position: 0,
          },
        ],
      },
    ],
  };
}

export function getEducatorCourseOptions() {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
  }));
}

export function getEducatorCourseDashboard(
  courseId: string,
): EducatorCourseDashboard | undefined {
  const course = courses.find((entry) => entry.id === courseId);
  if (course === undefined) {
    return undefined;
  }

  return buildDashboardForCourse(course.id, course.title);
}
