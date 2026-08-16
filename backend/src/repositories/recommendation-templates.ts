export type FlagType =
  | 'repeated_low_topic'
  | 'fast_low_score'
  | 'broad_knowledge_gap'
  | 'rushed_difficult_questions'
  | 'content_not_retained'
  | 'mandatory_at_risk';

export type Audience = 'student' | 'educator';

export type RecommendationCategory =
  | 'needs_reinforcement'
  | 'take_your_time'
  | 'talk_to_educator';

export type CtaType = 'quiz' | 'content' | 'none';

export type TemplateEntry = {
  category: RecommendationCategory;
  sentence: string;
  evidence: string;
  cta: CtaType;
};

// All copy lives here. Detection logic writes flag_type + evidence only.
// Swap audience key to get educator-facing copy from the same flags.
export const TEMPLATES: Partial<Record<`${FlagType}:${Audience}`, TemplateEntry>> = {
  'repeated_low_topic:student': {
    category: 'needs_reinforcement',
    sentence:
      'Revisit the {topic} material — your score there is {score}%.',
    evidence:
      'Your score on {topic} has stayed below {threshold}% across {questions} questions answered in that section.',
    cta: 'content',
  },
  'content_not_retained:student': {
    category: 'needs_reinforcement',
    sentence:
      'Go back and re-read the {topic} content before attempting more quiz questions.',
    evidence:
      'Time spent on the {topic} content was above your usual, but the quiz score for that section was {score}%.',
    cta: 'content',
  },
  'fast_low_score:student': {
    category: 'take_your_time',
    sentence: 'Take your time and read each question carefully before answering.',
    evidence:
      'This quiz was completed faster than typical, alongside a lower score.',
    cta: 'quiz',
  },
  'rushed_difficult_questions:student': {
    category: 'take_your_time',
    sentence: 'Take your time and read each question carefully before answering.',
    evidence:
      'Several harder questions were answered quickly and incorrectly.',
    cta: 'quiz',
  },
  'broad_knowledge_gap:student': {
    category: 'talk_to_educator',
    sentence:
      'Scores are below the target in most sections of this course — consider talking to your educator about where to focus next.',
    evidence:
      'More than {gap_percent}% of the sections you have attempted in this course are currently below 50%.',
    cta: 'none',
  },

  // Educator templates — same flags, direct diagnostic language.
  'repeated_low_topic:educator': {
    category: 'needs_reinforcement',
    sentence:
      '{topic} shows a persistent knowledge gap: {score}% across {questions} questions answered — possible prior-knowledge gap.',
    evidence:
      'Score on {topic} stayed below {threshold}% across {questions} questions answered in that section.',
    cta: 'content',
  },
  'content_not_retained:educator': {
    category: 'needs_reinforcement',
    sentence:
      'Possible retention issue in {topic}: content view time was high but quiz score was {score}% — possible low engagement or prior-knowledge gap.',
    evidence:
      'Content view time for {topic} was above the student median; section quiz score was {score}%.',
    cta: 'content',
  },
  'fast_low_score:educator': {
    category: 'take_your_time',
    sentence:
      'Possible guessing pattern: quiz completed quickly with a score of {score}%.',
    evidence:
      'Quiz completion time was well below the student median, with a score of {score}%.',
    cta: 'quiz',
  },
  'rushed_difficult_questions:educator': {
    category: 'take_your_time',
    sentence:
      'Possible low engagement with harder questions: {rushed_count} hard-difficulty items answered quickly and incorrectly.',
    evidence:
      '{rushed_count} hard-difficulty questions were answered in under {threshold_seconds}s and answered incorrectly.',
    cta: 'quiz',
  },
  'broad_knowledge_gap:educator': {
    category: 'talk_to_educator',
    sentence:
      'Broad knowledge gap: {gap_percent}% of attempted sections are below 50% — consider a check-in or differentiated support.',
    evidence:
      'Over {gap_percent}% of sections with enough data are below the 50% threshold.',
    cta: 'none',
  },

  // Educator-only: mandatory enrollment with insufficient quiz progress.
  // No student template — the flag is silently skipped in student dashboard renders.
  'mandatory_at_risk:educator': {
    category: 'talk_to_educator',
    sentence:
      'Mandatory course requirement not met — {attempts} quiz attempt(s) completed, minimum is {min_attempts}. Due {due_date}.',
    evidence:
      '{attempts} completed quiz attempt(s) recorded against a required minimum of {min_attempts}. Enrollment due date: {due_date}.',
    cta: 'none',
  },
};

export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}
