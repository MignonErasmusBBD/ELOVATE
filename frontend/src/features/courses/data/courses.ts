import type { Course } from "../types";

export const courses: Course[] = [
  {
    id: "master-design-patterns",
    title: "Master Design Patterns",
    description:
      "Learn industry-standard design patterns to write better, more maintainable code.",
    iconName: "eye",
  },
  {
    id: "data-structures-algorithms",
    title: "Data Structures & Algorithms",
    description:
      "Master essential data structures and algorithmic thinking for efficient problem solving.",
    iconName: "gitBranch",
  },
  {
    id: "system-design-fundamentals",
    title: "System Design Fundamentals",
    description:
      "Learn to design scalable, reliable, and maintainable software systems.",
    iconName: "layers",
  },
  {
    id: "clean-code-principles",
    title: "Clean Code Principles",
    description:
      "Write readable, maintainable code following industry best practices.",
    iconName: "code",
  },
  {
    id: "api-design-development",
    title: "API Design & Development",
    description:
      "Build robust and well-documented RESTful APIs from scratch.",
    iconName: "server",
  },
  {
    id: "testing-qa-strategies",
    title: "Testing & QA Strategies",
    description:
      "Comprehensive testing methodologies from unit tests to end-to-end testing.",
    iconName: "checkCircle",
  },
];

export function getCourseById(courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId);
}
