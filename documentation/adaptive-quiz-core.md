# Adaptive Quiz Generation — Core Design

## Overview

ELOVATE's practice quiz system generates personalised question sets for each student based on their learning history. Rather than serving random or fixed questions, the engine scores every available question against the student's current mastery profile and uses weighted random sampling to select a set that targets real weaknesses while remaining varied enough to feel like a complete assessment.

---

## Student Mastery Profile

Three mastery dimensions are tracked per student, per course:

| Dimension | Table | Key |
|-----------|-------|-----|
| Course section | `student_section_mastery` | `course_section_id` |
| Bloom level | `student_bloom_mastery` | `bloom_level_id` |
| Difficulty | `student_difficulty_mastery` | `difficulty_level_id` |

Each record stores `questions_answered` and `correct_count`. A **gap** for any dimension is computed as:

```
gap = 1 − (correct_count / questions_answered)   [if questions_answered > 0]
gap = 0.5                                          [if never attempted — neutral prior]
```

A gap of `1.0` means the student got every question in that category wrong; `0.0` means they got every question right. Neutral `0.5` is used for unseen categories so the engine still explores them rather than avoiding them.

### Why sections, not tags

Every question is linked to exactly one course section (the educator picks this when creating the question). Sections correspond directly to the lesson content the student reads — so "Section 3: Sorting Algorithms" as a mastery dimension is far more meaningful than a free-form tag. It tells the engine which part of the course the student needs to revisit, and it shows the student a breakdown they can act on.

---

## Per-Question Adaptive Score

Every active question for the course receives a score before sampling:

```
score = sectionGap × 0.4
      + bloomGap   × 0.3
      + diffGap    × 0.2
      + noveltyBonus
```

### Component weights

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Section gap | **0.4** | Which part of the course the student understands is the primary signal |
| Bloom gap | **0.3** | Cognitive depth (Remember → Create) is a key secondary signal |
| Difficulty gap | **0.2** | Difficulty calibration matters but is tertiary |
| Novelty bonus | **+0.1 / −0.15** | Rewards unseen questions, penalises recently seen ones |

### Section gap

Each question belongs to one section. The section gap is a direct lookup:

```
sectionGap = gap(question.courseSectionId)
```

If the student has never been served a question from that section, the neutral prior of `0.5` applies — ensuring every section gets explored before the engine doubles down on known weak spots.

### Novelty bonus

The engine tracks every question ID the student has previously been served (across all prior attempts for this course). Questions seen before receive a **−0.15** penalty; questions never served receive a **+0.1** bonus. This nudges the engine toward fresh material while not completely excluding questions the student struggled with.

---

## Weighted Random Sampling

After scoring, the engine does **weighted random sampling without replacement** to choose `N` questions (where `N = course.quiz_question_count`, maximum 20):

1. Normalise scores to obtain a probability distribution.
2. Draw one question proportionally to its weight.
3. Remove the drawn question and renormalise.
4. Repeat until `N` questions are selected.

This approach preserves randomness — a low-scoring (well-mastered) question can still appear — while ensuring the distribution of selected questions skews toward weaker areas. Two students with different profiles will receive different question sets even from the same pool.

---

## Quiz Lifecycle

```
generate  →  start  →  [answer × N]  →  complete
```

| Phase | What happens |
|-------|-------------|
| **generate** | Adaptive selection runs; a `quiz_attempts` row is created with status `generated`; items are inserted but all correctness data is hidden from the client |
| **start** | Status moves to `in_progress`; timestamp recorded |
| **answer** | Each submitted answer is marked server-side; `is_correct` and `answered_at` are set on the item; only *answered* items reveal correctness to the client — future items remain hidden |
| **complete** | Status moves to `completed`; mastery tables are updated; ELO-style rating delta is applied |

### Security model

The backend never sends `isCorrect` on options or the item itself until the student has already answered that specific item (`answered_at IS NOT NULL`). This means:

- A student cannot pre-inspect the correct answer before submitting.
- After answering, the full feedback (correct option, is_correct flag) is immediately available — enabling the per-question feedback UX.
- Network inspection of future questions reveals nothing useful because those items carry `isCorrect: undefined` and all option `isCorrect` fields are stripped.

---

## Mastery Update (post-completion)

After `complete` is called, the repository updates all three mastery dimensions for every answered item:

```
FOR each answered item:
  UPDATE student_section_mastery    SET answered += 1, correct += (1 if correct)
  UPDATE student_bloom_mastery      SET answered += 1, correct += (1 if correct)
  UPDATE student_difficulty_mastery SET answered += 1, correct += (1 if correct)
```

Because each question belongs to exactly one section, the section rollup is a simple group-by — no join table needed. All upserts use `ON CONFLICT DO UPDATE` so the first quiz for any dimension creates the row automatically.

The weights actually selected by the generator are also recorded in `quiz_section_weights`, `quiz_bloom_weights`, and `quiz_difficulty_weights` for audit and future analytics.

### ELO-style rating

A simple rating delta is applied to `student_course_profile.current_rating`:

```
delta = (correctCount − wrongCount) × 10
```

The rating floats up when the student does well and down when they struggle. It feeds back into the next quiz generation cycle as a coarse signal for how the student is performing overall.

---

## Configuration

| Setting | Location | Default | Range |
|---------|----------|---------|-------|
| Questions per quiz | `courses.quiz_question_count` | 10 | 1 – 20 |

Educators can adjust the question count per course via `PATCH /courses/:id` with `{ quizQuestionCount: N }`. The backend enforces the [1, 20] range regardless of the value sent.

---

## Example: Two Students, Same Course

Suppose a course has 40 active questions spread across three sections: Introduction, Core Concepts, and Advanced Topics.

**Student 1** has answered many Introduction questions correctly and has never touched Core Concepts or Advanced Topics.

- Introduction section gap ≈ 0.1 (strong)
- Core Concepts gap = 0.5 (unseen, neutral prior)
- Advanced Topics gap = 0.5 (unseen, neutral prior)

The engine scores Core Concepts and Advanced Topics questions higher. The student's quiz will skew toward those sections with a sprinkling of Introduction questions to keep the assessment honest.

**Student 2** has struggled with Bloom-level *Analyze* questions but breezes through *Remember* and *Understand*.

- Bloom gap for Analyze ≈ 0.8
- Bloom gap for Remember ≈ 0.1

Analyze questions receive a large boost from the bloom component (0.3 weight). Even if the student has seen some of them before (−0.15 novelty penalty), their high bloom gap likely keeps them competitive in the score ranking.

This targeted selection means each redo of the quiz is a new, personalised challenge — not the same shuffled deck.
