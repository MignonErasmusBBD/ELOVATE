# Elovate — database design

A general adaptive-learning platform. Organisations own users and courses; courses can stay
private to an organisation or be published to the community, and other organisations can
adopt a published course to track their own people against it.

## Assumptions (flag if any of these are wrong)

- Every user belongs to exactly one organisation. An individual signing up outside any
  company gets a personal organisation created automatically at signup — there's no
  "orphan" user with `organization_id = NULL`. This keeps every query, permission check,
  and analytics rollup uniform instead of special-casing solo users.
- Roles and permissions are platform-wide definitions (e.g. `learner`, `instructor`,
  `org_admin`) rather than custom per organisation. If you want organisations to define
  their own custom roles later, that's a straightforward extension (add
  `organization_id` to `roles`) — not designed in now, to keep v1 simple.
- A course has one *owning* organisation (who authored it) but can be *adopted* by many
  other organisations once published — that distinction is what separates
  `org_course_adoptions` from plain `enrollments` below.
- Question difficulty and learner rating both live on the same numeric scale (the "ELO"
  score), so a question's `base_difficulty` and a learner's `current_rating` are directly
  comparable.

## Design principles

- **3NF throughout.** Every non-key column depends on the whole primary key and nothing
  but the key — no column is derivable from another non-key column in the same table.
  A couple of examples of where this shaped the design:
  - `questions` stores `course_section_id`, not `course_id` — `course_id` is derivable
    by joining through the section, so storing it directly would be a transitive
    dependency (redundant and riskier to keep in sync).
  - `quiz_attempt_items` stores neither `user_id` nor `course_id` — both are derivable
    via `quiz_attempt_id → quiz_attempts.user_id / course_id`.
- **Every many-to-many relationship gets its own junction table** with a composite
  primary key — `user_roles`, `role_permissions`, `question_topics`, `cohort_members`.
  No comma-separated lists, no JSON arrays standing in for a relationship.
- **No native enum types or free-text CHECK constraints** — every fixed vocabulary
  (statuses, visibility, format, trigger type, Bloom level, difficulty level) is its own
  lookup table instead. Adding a new value is a plain `INSERT`, not a migration.
- **Lookup tables use `smallint` primary keys, not `uuid`.** `uuid` earns its keep on
  tables with unpredictable, multi-writer growth (`users`, `courses`,
  `quiz_attempt_items`) — it's unnecessary overhead on a table with a dozen admin-curated
  rows. A 2-byte `smallint` join key is cheaper to store and faster to index than a
  16-byte `uuid`, with no downside, since nothing about these tables needs uuid's
  collision-free, generate-anywhere properties.
- **One deliberate exception**: the learning-profile tables (`student_course_profile`,
  `student_topic_mastery`, `student_difficulty_mastery`, `student_bloom_mastery`,
  `overall_learning_profile`) are materialised snapshots, not raw facts — every one of
  them is derivable by replaying `quiz_attempt_items`. They're kept as their own tables
  anyway because "what's this learner's rating right now" is queried constantly (dashboards,
  generating the next quiz's question weighting) and recomputing it from full history on
  every read doesn't scale. See the dedicated section below for the full reasoning on why
  these are tables, not views, and why there's no separate history table.

---

## 1. Identity & access

### organizations
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| slug | text | unique |
| created_at | timestamptz | |

### users
No password is stored — auth is delegated to an OAuth provider (Google, Microsoft, etc.),
so what's kept is the provider's identifier for the account, not a credential.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK → organizations.id | every user belongs to exactly one org |
| email | text | unique |
| oauth_provider_id | smallint FK → oauth_providers.id | |
| oauth_id | text | the subject/user id issued by that provider |
| full_name | text | |
| created_at | timestamptz | |
| | | **UNIQUE (oauth_provider_id, oauth_id)** — the pair, not `oauth_id` alone, since two different providers could issue the same id string independently |

If you ever need to support a user signing in through *more than one* provider on the same
account (e.g. they start with Google, later add Microsoft), `oauth_provider_id`/`oauth_id`
would need to move out into their own `oauth_identities` table (`user_id`, `provider_id`,
`provider_user_id`, one row per linked identity) rather than living directly on `users`.
Not built here since the ask was to keep it simple — flagging it as the natural next step
if multi-provider linking becomes a real requirement.

### oauth_providers — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `google`, `microsoft` |

### roles
Small, admin-curated set — same `smallint` reasoning as the lookup tables below, even
though it's business config rather than a pure enum.

| column | type | notes |
|---|---|---|
| id | smallint PK | |
| name | text | unique — e.g. `learner`, `instructor`, `org_admin`, `platform_admin` |
| description | text | |

### permissions
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — e.g. `course.publish`, `user.invite`, `analytics.view` |
| description | text | |

### user_roles — junction, users ↔ roles (many-to-many)
| column | type | notes |
|---|---|---|
| user_id | uuid FK → users.id | |
| role_id | smallint FK → roles.id | |
| granted_at | timestamptz | |
| | | **PK (user_id, role_id)** |

### role_permissions — junction, roles ↔ permissions (many-to-many)
| column | type | notes |
|---|---|---|
| role_id | smallint FK → roles.id | |
| permission_id | smallint FK → permissions.id | |
| | | **PK (role_id, permission_id)** |

---

## 2. Courses & content

### courses
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| owning_organization_id | uuid FK → organizations.id | the org that authored it |
| title | text | |
| description | text | |
| visibility_id | smallint FK → course_visibilities.id | |
| created_by | uuid FK → users.id | |
| created_at / updated_at | timestamptz | |

### course_sections
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| course_id | uuid FK → courses.id | |
| title | text | |
| position | int | ordering within the course |

### topics
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| course_id | uuid FK → courses.id | |
| name | text | |

### questions
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| course_section_id | uuid FK → course_sections.id | `course_id` derived via this, not stored |
| format_id | smallint FK → question_formats.id | |
| prompt | text | |
| bloom_level_id | smallint FK → bloom_levels.id | what cognitive skill this question exercises |
| difficulty_level_id | smallint FK → difficulty_levels.id | author-facing bucket, e.g. `Hard` |
| base_difficulty | float | precise ELO-scale value the adaptive engine actually matches against |
| created_by | uuid FK → users.id | |
| created_at | timestamptz | |

`difficulty_level_id` and `base_difficulty` look redundant at first glance but serve different
consumers: `difficulty_level` is how an instructional designer tags a question while authoring
it and how a report groups questions ("accuracy on Hard questions"); `base_difficulty` is the
continuous number the adaptive engine actually does maths with. Keeping both means content
authors never have to think in ELO points, and the engine never has to reason about buckets.

### course_visibilities — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `private`, `community` |

### question_formats — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `mcq`, `true_false`, `short_answer` |

### bloom_levels — reference table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| name | text | unique — Remember, Understand, Apply, Analyze, Evaluate, Create |
| rank | smallint | unique — orders them by increasing cognitive complexity |

### difficulty_levels — reference table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| name | text | unique — e.g. Easy, Medium, Hard, Expert |
| rank | smallint | unique — orders them by increasing difficulty |

### question_options
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| question_id | uuid FK → questions.id | |
| option_text | text | |
| is_correct | boolean | |
| position | int | |

### question_topics — junction, questions ↔ topics (many-to-many)
| column | type | notes |
|---|---|---|
| question_id | uuid FK → questions.id | |
| topic_id | uuid FK → topics.id | |
| | | **PK (question_id, topic_id)** |

---

## 3. Enrollment & organisation adoption

### org_course_adoptions
Tracks which *other* organisations have picked up a published community course for their
own people — separate from an individual's enrollment, because this is what the
"assign a community course to your team" flow and cohort-level analytics hang off.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK → organizations.id | the adopting org (not the owner) |
| course_id | uuid FK → courses.id | |
| adopted_at | timestamptz | |
| | | **UNIQUE (organization_id, course_id)** |

### enrollments
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| enrolled_at | timestamptz | |
| status_id | smallint FK → enrollment_statuses.id | |

### enrollment_statuses — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `active`, `completed`, `withdrawn` |

---

## 4. Quiz generation & rating

Practice quizzes are generated one-shot: when a learner starts a new practice quiz, the
system reads their current profile (below) and decides — *before any question is shown* —
how many questions to pull from each topic, difficulty band, and Bloom level. There's no
per-question re-rating during the quiz itself; the rating updates once, when the whole quiz
is scored, and *that* result is what shapes the next quiz's weighting.

### quiz_attempts
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| generated_at | timestamptz | when the question set was composed |
| started_at | timestamptz | nullable — a generated quiz can sit unopened |
| completed_at | timestamptz | nullable |
| status_id | smallint FK → quiz_attempt_statuses.id | |
| rating_at_generation | float | learner's course rating at the moment this quiz was built — the input the weighting below was calculated from |
| rating_at_completion | float | nullable — set once the quiz is scored |

### quiz_attempt_statuses — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `generated`, `in_progress`, `completed`, `abandoned` |

### quiz_attempt_items
One row per question in the generated set.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| quiz_attempt_id | uuid FK → quiz_attempts.id | |
| question_id | uuid FK → questions.id | topic/difficulty/bloom tags derived via this |
| selected_option_id | uuid FK → question_options.id | nullable until answered |
| is_correct | boolean | nullable until answered |
| answered_at | timestamptz | nullable |

No `rating_before`/`rating_after` here anymore — since adaptivity no longer happens
mid-quiz, a per-question rating delta isn't a meaningful concept. The quiz's score
(`correct_count / questions_answered`, cheap to compute over a single quiz's ~10-30 items)
is what feeds `rating_at_completion`.

### quiz_topic_weights, quiz_difficulty_weights, quiz_bloom_weights
Three sibling tables, one per generation dimension, each recording what the generator
*intended* for this specific quiz — not just what happened to end up in it. `target_weight`
is the input to selection; `questions_allocated` is how many slots the generator actually
planned for that value (these two can genuinely differ from the final composition if the
question pool ran short in a topic and the generator substituted — that's a legitimate
planning fact, not something derivable after the fact from the final item list).

Three separate tables rather than one combined table, because the three dimensions serve
different goals in the weighting algorithm (see below) and a single "topic × difficulty ×
bloom" table would explode into far more rows than the quiz actually has questions.

| quiz_topic_weights | type |
|---|---|
| quiz_attempt_id | uuid FK → quiz_attempts.id |
| topic_id | uuid FK → topics.id |
| target_weight | float |
| questions_allocated | int |
| | **PK (quiz_attempt_id, topic_id)** |

| quiz_difficulty_weights | type |
|---|---|
| quiz_attempt_id | uuid FK → quiz_attempts.id |
| difficulty_level_id | smallint FK → difficulty_levels.id |
| target_weight | float |
| questions_allocated | int |
| | **PK (quiz_attempt_id, difficulty_level_id)** |

| quiz_bloom_weights | type |
|---|---|
| quiz_attempt_id | uuid FK → quiz_attempts.id |
| bloom_level_id | smallint FK → bloom_levels.id |
| target_weight | float |
| questions_allocated | int |
| | **PK (quiz_attempt_id, bloom_level_id)** |

### The generation loop, and why difficulty and topic weighting aren't the same knob

- **Difficulty weighting targets flow**, not remediation: pull the difficulty distribution
  toward a band just above `rating_at_generation`, not toward the learner's weakest band.
  Deliberately serving someone their worst difficulty level repeatedly is how you produce
  frustration, not flow — the classic flow-channel idea is challenge slightly ahead of
  current skill, continuously.
- **Topic and Bloom weighting target remediation**: skew *toward* whatever
  `student_topic_mastery` / `student_bloom_mastery` show as weak, since the goal there is
  coverage and reinforcement, not a stretch challenge.
- The loop: `student_course_profile` / `student_topic_mastery` / `student_difficulty_mastery`
  / `student_bloom_mastery` (below) → read at generation time to compute
  `quiz_*_weights` → questions selected into `quiz_attempt_items` → learner answers →
  quiz is scored → `rating_at_completion` is set and all four profile tables are updated →
  next quiz generation reads the updated profile. Nothing here needs a live per-question
  update path anymore, which simplifies the write side considerably compared to the
  item-by-item version.

One ripple effect worth flagging: the earlier "rating climbs question by question" hero
chart concept on the landing page now more accurately reads as **rating climbing quiz by
quiz** (`rating_at_generation` → `rating_at_completion` across attempts), not question by
question — worth reconciling if that visual matters to keep literally accurate.

---

## Learning profiles — materialised summaries, not views

Everything below answers "how is this learner doing" at different levels of granularity —
per course, per topic, per difficulty band, per Bloom level, and rolled up across every
course. All five are **materialised summary tables, kept in sync from the application
transaction that writes each `quiz_attempt_items` row** (see the reasoning below), not
database views and not a separate history table.

**Why not a view?** A view recomputes from `quiz_attempt_items` on every read. That's fine
for an occasional report, but generating a new quiz needs a learner's current profile in
the critical path of "what should this quiz contain" — every generation event does several
lookups here (course rating, plus per-topic/difficulty/bloom mastery). Recomputing all of
that over potentially thousands of historical rows on every generation is the wrong
trade-off when a handful of single-row lookups does the same job.

**Why not a database trigger?** A trigger keeps things consistent even against raw SQL or a
bulk backfill, which is a real advantage. But the ELO/mastery calculation is core business
logic that's likely to change as the algorithm gets tuned — that's much easier to test,
code-review, and deploy as application code than as logic buried in the database. Default
to updating these tables in the same transaction as the answer write; keep a trigger-based
version in mind as a fallback if you ever need a stronger consistency guarantee than the
application layer can promise (e.g. multiple services writing `quiz_attempt_items`
directly).

**Why not a separate history table?** `quiz_attempt_items` already *is* the history — an
immutable, append-only, timestamped row per answer. There's no need for a "snapshot +
copy-on-update" audit table, because these summary tables are disposable: if one is ever
wrong or you add a new dimension later, you rebuild it by replaying `quiz_attempt_items`
from the start. That rebuildability is what makes it safe to treat them as a cache rather
than as data that itself needs backing up separately.

### student_course_profile
The per-course "learning profile" — one row per learner per course.

| column | type | notes |
|---|---|---|
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| current_rating | float | |
| questions_answered | int | |
| correct_count | int | |
| last_answered_at | timestamptz | |
| updated_at | timestamptz | |
| | | **PK (user_id, course_id)** |

### student_topic_mastery
Powers "how do they do per topic."

| column | type | notes |
|---|---|---|
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| topic_id | uuid FK → topics.id | |
| questions_answered | int | |
| correct_count | int | |
| updated_at | timestamptz | |
| | | **PK (user_id, course_id, topic_id)** |

### student_difficulty_mastery
Powers "how do they do on difficult questions."

| column | type | notes |
|---|---|---|
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| difficulty_level_id | smallint FK → difficulty_levels.id | |
| questions_answered | int | |
| correct_count | int | |
| updated_at | timestamptz | |
| | | **PK (user_id, course_id, difficulty_level_id)** |

### student_bloom_mastery
Powers "how do they do at each cognitive level" (recall vs. applying vs. evaluating, etc).

| column | type | notes |
|---|---|---|
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| bloom_level_id | smallint FK → bloom_levels.id | |
| questions_answered | int | |
| correct_count | int | |
| updated_at | timestamptz | |
| | | **PK (user_id, course_id, bloom_level_id)** |

### overall_learning_profile
The cross-course rollup — one row per user, built from every `student_course_profile` row
they have.

| column | type | notes |
|---|---|---|
| user_id | uuid PK, FK → users.id | |
| aggregate_rating | float | e.g. a weighted average across their courses |
| total_courses | int | |
| total_questions_answered | int | |
| updated_at | timestamptz | |

---

## 5. Analytics & intervention

### cohorts
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK → organizations.id | |
| name | text | e.g. "Q3 new hires" |
| created_at | timestamptz | |

### cohort_members — junction, cohorts ↔ users (many-to-many)
| column | type | notes |
|---|---|---|
| cohort_id | uuid FK → cohorts.id | |
| user_id | uuid FK → users.id | |
| | | **PK (cohort_id, user_id)** |

### intervention_rules
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK → organizations.id | nullable = platform-default rule |
| name | text | |
| trigger_type_id | smallint FK → intervention_trigger_types.id | |
| threshold_value | float | |
| window_size | int | e.g. "over the last N questions" |
| created_at | timestamptz | |

### intervention_flags
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | |
| course_id | uuid FK → courses.id | |
| rule_id | uuid FK → intervention_rules.id | |
| triggered_at | timestamptz | |
| status_id | smallint FK → intervention_flag_statuses.id | |
| resolved_by | uuid FK → users.id | nullable |
| resolved_at | timestamptz | nullable |

### intervention_trigger_types — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `rating_stall`, `rating_drop`, `inactivity` |

### intervention_flag_statuses — lookup table
| column | type | notes |
|---|---|---|
| id | smallint PK | |
| code | text | unique — `open`, `acknowledged`, `resolved` |

---

## Relationship summary

| Relationship | Type | Via |
|---|---|---|
| organizations → users | 1:M | `users.organization_id` |
| users ↔ roles | M:M | `user_roles` |
| roles ↔ permissions | M:M | `role_permissions` |
| organizations → courses | 1:M | `courses.owning_organization_id` |
| courses → course_sections → questions | 1:M, 1:M | |
| questions → bloom_levels / difficulty_levels | M:1, M:1 | `questions.bloom_level_id` / `.difficulty_level_id` |
| questions ↔ topics | M:M | `question_topics` |
| questions → question_options | 1:M | |
| organizations ↔ courses (adoption) | M:M | `org_course_adoptions` |
| users ↔ courses (enrollment) | M:M | `enrollments` |
| users → quiz_attempts → quiz_attempt_items | 1:M, 1:M | |
| quiz_attempts → quiz_topic_weights / quiz_difficulty_weights / quiz_bloom_weights | 1:M each | generation-time weighting, one set per quiz |
| users ↔ courses (learning profile) | 1 row per pair | `student_course_profile` |
| users ↔ courses ↔ topics (topic mastery) | 1 row per triple | `student_topic_mastery` |
| users ↔ courses ↔ difficulty_levels | 1 row per triple | `student_difficulty_mastery` |
| users ↔ courses ↔ bloom_levels | 1 row per triple | `student_bloom_mastery` |
| users → overall_learning_profile | 1:1 | rolled up from `student_course_profile` |
| organizations → cohorts ↔ users | 1:M, M:M | `cohort_members` |
| organizations → intervention_rules → intervention_flags | 1:M, 1:M | |

## Open questions worth deciding before build

1. Should `topics` be scoped per-course (as designed) or a shared platform-wide taxonomy
   that any course can tag into? Per-course is simpler to start; a shared taxonomy makes
   cross-course analytics ("how do learners do on *negotiation* topics generally")
   possible later but is a bigger lift.
2. Should `roles` support organisation-specific custom roles now, or is the fixed set
   (`learner`, `instructor`, `org_admin`, `platform_admin`) enough for v1?
3. `cohorts` here are organisation-wide, not tied to one course — confirm that matches
   how you want cohort dashboards to work (a cohort spanning several courses vs. one
   cohort per course).
4. `overall_learning_profile.aggregate_rating` needs a real formula — a simple average
   across `student_course_profile` rows treats a 3-question course the same as a
   300-question one. Worth deciding whether it's weighted by `questions_answered`,
   by recency, or something else before this ships.

---

## Scaling this design

**What grows fastest**: `quiz_attempt_items`, by a wide margin — one row per question per
attempt, continuously, for as long as anyone's using the platform. `quiz_attempts`,
`quiz_topic_weights`/`quiz_difficulty_weights`/`quiz_bloom_weights`, and the profile update
traffic follow the same curve. Everything else (`organizations`, `courses`, `questions`,
`users`) grows orders of magnitude slower. Put scaling effort where the volume actually is.

**Partition the high-volume tables by time.** Range-partition `quiz_attempt_items` and
`quiz_attempts` monthly or quarterly, on `answered_at`/`generated_at`. This keeps indexes
small (a "this learner's last 3 months" query only touches recent partitions), makes old
data cheap to retire (detach + archive a whole partition instead of a slow `DELETE`), and
lets routine maintenance work on manageable chunks instead of one ever-growing table.

**Index for the access patterns that actually happen**, not just the FKs:
- Every FK needs an explicit index — Postgres/MySQL don't create one automatically the
  way they do for a PK.
- Composite indexes matching real queries: `quiz_attempts(user_id, course_id,
  generated_at DESC)` for "this learner's latest quiz," `quiz_attempt_items
  (quiz_attempt_id)` for loading a quiz's question set.
- Partial indexes for hot subsets — `intervention_flags WHERE status = 'open'` is a much
  smaller, much more frequently queried slice than the whole table.
- Reconsider random UUIDv4 as the PK type specifically for `quiz_attempt_items` (the
  highest-volume table) — random UUIDs scatter inserts across the whole B-tree and bloat
  the index under high write volume. UUIDv7 (time-ordered) or a plain bigint identity
  column both insert append-mostly and stay compact. Not worth the migration complexity
  on low-volume tables like `organizations` — just where the volume actually justifies it.

**Move the profile updates off the request path.** Right now "update the four mastery
tables after each answer" is described as happening in the same transaction as the write,
which is correct for consistency but means a learner's click is blocked on four extra
`UPDATE`s. At scale, move that to an async worker (a queue, or Postgres `LISTEN/NOTIFY`)
triggered by the write rather than inline. The mastery tables become eventually consistent
by a few seconds — fine, since the next quiz isn't generated the instant the last one ends.

**Read replicas for anything that isn't quiz generation.** The one query that must be fast
*and* fresh is a learner's own profile at generation time. Org dashboards, cohort
comparisons, and intervention sweeps are read-heavy and latency-tolerant — point those at
a replica so they're not competing with the live quiz-taking path for the primary
database's resources.

**Views are the right tool here — just not for the per-user hot path.** Earlier in this
doc, views were ruled out for the per-user mastery tables specifically because quiz
generation needs them fast and fresh. That reasoning doesn't extend to org-wide or
cohort-wide reporting — "average rating across this 400-person cohort this month" doesn't
need to be sub-second-fresh. A materialised view refreshed nightly (or hourly) is the
right tool at that tier, and saves hand-maintaining more triggers for data nobody needs live.

**Multi-tenancy.** Every table that matters for isolation already carries
`organization_id`, directly or via one join — which means row-level security policies
scoped to it are a straightforward add later if you need hard tenant isolation. If a
single organisation ever gets disproportionately large (millions of learners in one org),
that's the point to consider sharding by `organization_id` — a last-resort move once
there's a specific org causing a specific problem, not something to build in speculatively.

**Don't over-normalize once real query data exists.** 3NF is the right starting
discipline — it's what this whole design has been built on. But once profiling shows a
specific join is a genuine bottleneck, it's normal and correct to selectively denormalize
that one hot path (e.g. storing `course_id` directly on `quiz_attempt_items` even though
it's derivable via `quiz_attempt_id`, because some report joins through it constantly).
Do that when the data says so, not upfront — and document it the same way
`student_course_profile` and the other intentional exceptions already are in this doc.
