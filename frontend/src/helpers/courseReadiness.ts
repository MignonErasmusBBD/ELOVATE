export const MIN_COURSE_SECTIONS_TO_ACTIVATE = 1;
export const MIN_ACTIVE_QUESTIONS_TO_ACTIVATE = 20;

export function canActivateCourse(input: {
  sectionCount: number;
  activeQuestionCount: number;
}): boolean {
  return (
    input.sectionCount >= MIN_COURSE_SECTIONS_TO_ACTIVATE &&
    input.activeQuestionCount >= MIN_ACTIVE_QUESTIONS_TO_ACTIVATE
  );
}
