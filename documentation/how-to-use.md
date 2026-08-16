# ELOVATE — How to Use

ELOVATE is an adaptive learning platform. What you can see and do depends on your role. This guide walks through each role step by step.

---

## Roles at a Glance

| Role | What they do |
|---|---|
| **Learner** | Browse courses, read lessons, take quizzes, track personal progress |
| **Educator** | Create and manage courses, learning content, questions, and monitor student performance |
| **Organisation Admin** | Manage organisation members, private courses, and enrolments |
| **Community Admin** | Create and manage public courses available to all learners across the platform |
| **Platform Admin** | Create organisations and assign global roles across the platform |

A user can hold more than one role at the same time. Roles are assigned by admins — not self-selected.

---

## Getting Started

### Signing Up

1. Go to `/signup`
2. Enter your **first name**, **last name**, **email address**, and a **password**
3. Click **Sign Up** — or click **Continue with Google** to sign up instantly using your Google account
4. You are taken to the courses page

Every new account starts with the **Learner** role. An admin must grant additional roles.

### Logging In

1. Go to `/login`
2. Enter your email and password and click **Sign In** — or click **Continue with Google** to log in with your Google account
3. You land on the **Courses** page

---

## Learner

Learners browse courses, work through lesson content, practise with quizzes, and track their own performance.

### Browsing and Enrolling in Courses

1. After logging in you land on the **Courses** page (`/courses`)
2. Courses are grouped into three sections:
   - **My enrolled courses** — courses you are already taking
   - **Organisation courses** — private courses your organisation has created and granted you access to
   - **Explore** — public community courses open to everyone
3. Use the **search bar** to filter by title or description
4. Use the **filter tabs** (All / Community / Organisation / My Courses) to narrow the list
5. Each course card shows:
   - Title and description
   - Status (Active or Deactivated)
   - Visibility (Community or Organisation)
   - Your course status (Active, Completed, Overdue)
   - A **Required** badge and due date if the course is mandatory
6. To enrol in a community course, click **Enrol** on the course card
7. Click on any enrolled course card to open it

### Reading Lesson Content

1. Clicking a course card opens the **Lesson page** (`/student/courses/[courseId]`)
2. The sidebar lists all sections in the course — click any section to jump to it
3. Use the **Back** and **Next** buttons at the bottom to move between sections
4. Toggle between **Sub-tabs view** (one section at a time) and **Full-page view** (all sections at once) using the view controls at the top

**Adjusting how content looks:**

- Click the **Text size** controls to cycle through Small, Normal, Large, and Extra Large
- Click **Contrast** to switch between Normal and High Contrast mode
- These preferences are saved in your browser — they persist the next time you open the lesson

**Listening to content:**

- Click the **Listen** button to have the lesson read aloud
- This works in both sub-tabs and full-page view

### Taking a Practice Quiz

1. From a lesson page click **Go to Quiz**, or navigate directly to `/student/courses/[courseId]/quiz`
2. Click **Start Quiz** to generate a set of questions tailored to your current level
3. Each question appears on its own screen:
   - Select one of the multiple-choice options
   - Click **Submit Answer** — you cannot change your answer after this
   - Feedback is shown immediately (correct or incorrect)
4. Click **Next Question** to continue, or **Submit Quiz** to end early
5. After the last question (or submitting early) you see a **scorecard** showing:
   - Your score and rating change
   - Number of correct answers
   - Time taken
   - A breakdown by section
6. You can start a new quiz at any time — each attempt is tracked separately

The quiz engine is adaptive: questions are selected based on your current ELO-style rating and the gaps in your Bloom taxonomy and section coverage. Each session targets your actual weaknesses, not a random shuffle.

### Tracking Your Progress

1. From a course, navigate to `/student/courses/[courseId]/dashboard`
2. The dashboard shows:

**Summary cards**
- Total quiz attempts
- Your overall quiz average (%)
- Average time per quiz

**Attempts trend chart**
- A line chart showing how your score has changed across attempts
- Appears once you have completed at least 3 quizzes

**Breakdown tabs** — click each tab to see a different view:
- **Bloom** — your performance across cognitive levels (Remember → Create)
- **Section** — how you are doing in each course section
- **Difficulty** — performance split by Easy, Medium, and Hard questions

**Growth highlights** — appears once you have at least one attempt:
- Your improvement from first to recent attempts
- Best score, current average, most improved area, any regressions

**Recommendations** — personalised suggestions for what to focus on next, based on where your gaps are

---

## Educator

Educators create courses, write learning content and questions, and monitor how their students are performing. Access is at `/educator`.

> You need the **Educator** role (and optionally **Community Admin**) to access this section. If you only have the Educator role you can manage private organisation courses. If you also have Community Admin you can toggle between private and community courses.

### Selecting a Course

1. Go to `/educator`
2. If you have both Educator and Community Admin roles, use the **Community / Organisation** toggle to switch between public and private courses
3. Use the **course dropdown** to select which course you want to manage
4. The dashboard updates to show data for that course

### Creating a New Course

1. Click **Add Course** (top of the educator dashboard)
2. Enter a **title** and optionally a **description**
3. If you have both Educator and Community Admin roles, choose **Visibility** — Private (organisation only) or Community (public)
4. Click **Create**
5. The course starts as a **Draft** — learners cannot see it until you:
   - Add at least **1 section** (in the Learning Content tab)
   - Add at least **20 active questions** (in the Questions tab)
   - **Activate** the course

A readiness checklist at the top of the dashboard tracks your progress toward these requirements.

### Overview Tab

The Overview tab gives you a high-level picture of your course content and cohort performance.

- **Bloom's Taxonomy radar** — shows both question coverage and average learner performance across Remember, Understand, Apply, Analyse, Evaluate, and Create
- **Section overview** — a polar chart showing how questions are distributed across sections
- **Question by Bloom & Difficulty** — a bar chart showing how many questions sit at each Bloom level and difficulty combination
- **Diagnostic flag reference** — a table explaining the five automatic flags that can be raised for students, what triggers each one, and what action it suggests

### Practice Insights Tab

The Practice Insights tab shows cohort-level performance data.

**Practice attempt progress**
- A line chart of attempt scores over time
- Plots the class average, the course-wide baseline, and any outlier learners (those performing significantly above or below the class)

**Score distribution**
- A density curve comparing your class's actual score spread to an ideal distribution
- Highlights whether the class is skewed high, low, or well-spread

**Question success rates** (scroll down to reach this section)
- A donut chart showing how your questions are performing:
  - **Too hard** (red) — below 30% success rate with 3+ attempts
  - **Balanced** (green)
  - **Too easy** (amber) — above 95% success rate
  - **Insufficient data** (grey)
- Use the filter toggle to switch between:
  - **All** — the donut overview
  - **Needs revision (<30%)** — a list of underperforming questions with specific insights and the option to edit them
  - **High success (>95%)** — a list of questions that may no longer be challenging and could be deactivated

### Students Tab

The Students tab lists everyone enrolled in the selected course.

1. Use the **search bar** to find a student by name or email
2. Use the **filter tabs** — All / Mandatory enrolment / Non-mandatory enrolment
3. Each student card shows:
   - Name and email
   - Enrolment status (Active, Completed, Overdue, Withdrawn)
   - **Mandatory** badge if the enrolment is required
   - **Progress at risk** badge if the student has been flagged
   - Their practice quiz average and number of attempts

**Viewing a student's details**

1. Click **View Details** on any student card
2. A modal opens showing that student's full performance view:
   - Their metric cards (status, enrolment date, quiz average, attempts)
   - Their personal attempts trend chart
   - Any active recommendations or flags
   - Bloom, Section, and Difficulty breakdown tabs
   - Growth highlights
3. Click the **×** button or press Escape to close

**Checking mandatory progress**

1. Switch to the **Mandatory enrolment** filter
2. Click **Check mandatory progress**
3. ELOVATE evaluates whether each mandatory student is on track for their due date
4. Students who are not on pace are flagged with a **Progress at risk** badge

### Questions Tab

The Questions tab is where you build and maintain the quiz question bank for your course.

**Browsing questions**

- Use the **search bar** to filter by question text, format, Bloom level, difficulty, or section
- Each question card shows its prompt, format, Bloom level, difficulty, section, and active/inactive status
- Click a question card to expand it and see the full options, the correct answer, and the explanation

**Adding a question**

1. Click **Add Question**
2. Fill in:
   - **Section** — which course section this question belongs to
   - **Format** — currently Multiple Choice
   - **Prompt** — the question text
   - **Bloom level** — the cognitive level being tested
   - **Difficulty** — Easy, Medium, Hard, or Expert
   - **Options** — add at least two options and mark exactly one as correct
   - **Why this is correct** — optional explanation shown to students after answering
3. Click **Add Question**
4. The question is immediately active and will be drawn into new quizzes

**Editing a question**

1. Expand the question card
2. Click **Edit Question**
3. Update any fields
4. Click **Save**

**Activating or deactivating a question**

1. Expand the question card
2. Click **Activate** or **Deactivate**
3. Inactive questions are preserved in quiz history but not drawn into new quizzes
4. You need at least 20 active questions for learners to be able to start a quiz

### Learning Content Tab

The Learning Content tab is where you write and edit the lesson material that learners read before taking quizzes.

**Browsing sections**

- Each section card shows the section title and a preview of the first content block
- Click a section card to expand it and read the full content
- Content blocks are either **text** (prose) or **code** (formatted in monospace)

**Adding a section**

1. Click **Add Section**
2. Enter a **Section title**
3. Add one or more **content blocks** using the block editor:
   - Choose **Text** or **Code** for each block
   - Type the content into the text area
   - Click **Add block** to add more blocks
   - Click the remove button on any block to delete it
4. Click **Add Section**
5. The section is immediately visible to learners once the course is active

**Editing a section**

1. Expand the section card
2. Click **Edit Section**
3. Update the title or any content blocks, add new blocks, or remove existing ones
4. Click **Save**

**Deleting a section**

1. Expand the section card
2. Click **Delete**
3. The section is removed immediately — there is no confirmation step

---

## Organisation Admin

Organisation Admins manage the people, private courses, and enrolments within a single organisation. Access is at `/admin`.

> You need the **Organisation Admin** role and must be linked to an organisation to use this section.

### People

Manage who is in your organisation and what roles they hold.

**Viewing members**
- The People tab lists all current members with their name, email, and roles
- Use the search bar to find someone by name or email

**Add someone**
1. Add people to the organisation 

**Changing a member's role**
1. Find the person in the list
2. Assign or remove the **Educator** or **Organisation Admin** role within this organisation
3. Click **Save**

**Removing a member**
1. Find the person in the list
2. Click **Remove**
3. They are removed from the organisation (you cannot remove yourself)

### Courses

Create and manage private courses that are only visible to your organisation's members.

1. Click **Add Course** to create a new course — enter a title and description
2. Each course card shows the title, status (Draft / Active / Deactivated), and section and question counts
3. Use the **Edit** button to update the course title, description, or status
4. Use **Activate** or **Deactivate** to control learner visibility
5. Use **Delete** to permanently remove a course

> Learning content (sections) and questions are managed from the **Educator** dashboard, not here.

### Enrolments

Enrol your organisation's members into courses.

1. Click **Enrol people** (or the equivalent enrolment action)
2. Select a **course** from the dropdown
3. Select one or more **people** from your organisation to enrol
4. Optionally mark the enrolment as **Required** and set a **due date**
5. Click **Enrol**

To remove an enrolment, find the person in the enrolments list and click **Unenrol**.

---

## Community Admin

Community Admins create and manage public courses that are available to every learner on the platform, regardless of organisation. Access is at `/community`.

> You need the **Community Admin** role to access this section.

### Managing Public Courses

The Community Admin page shows a list of all public (community) courses.

**Creating a public course**
1. Click **Add Course**
2. Enter a **title** and optionally a **description**
3. Click **Create** — the course is automatically set to Community visibility
4. Add learning content and questions from the **Educator** dashboard
5. Activate the course when it is ready

**Activating and deactivating public courses**
- An **Active** community course appears in the Explore section for all learners
- **Deactivating** a course hides it from the public catalogue without deleting it
- Click **Activate** or **Deactivate** on any course card to change its status

**Deleting a public course**
- Click **Delete** on a course card to permanently remove it

> Once a community course is active, any learner across the platform can self-enrol. Educators with the Community Admin role can also manage community course content from the Educator dashboard.

---

## Platform Admin

Platform Admins manage the overall platform — creating organisations and assigning the most powerful roles. Access is at `/platform`.

> You need the **Platform Admin** role to access this section.

### Organisations Tab

Create and manage the organisations that exist on the platform.

**Creating an organisation**
1. Click **Create Organisation** (or equivalent)
2. Enter the **organisation name**
3. Click **Create**
4. The organisation is created and can now have members and courses

**Viewing organisations**
- The Organisations tab lists all organisations with their name and member count
- Use the search bar to find a specific organisation

### Roles Tab

Assign and manage global roles across the entire platform.

**Assigning Community Admin**
1. Find the person in the list (search by name or email)
2. Click **Assign Community Admin**
3. The person can now manage public courses at `/community`
4. Click **Remove Community Admin** to revoke the role

**Assigning Platform Admin**
1. Find the person in the list
2. Click **Assign Platform Admin**
3. The person now has full access to the `/platform` page and can manage organisations and roles
4. Use carefully — Platform Admins have full control of the platform

**Assigning Organisation Admin**
1. Find the person in the list
2. Select the **organisation** you want to assign them to
3. Click **Assign Org Admin**
4. The person can now manage people, courses, and enrolments for that organisation at `/admin`

> Platform Admins do not assign the **Educator** or **Learner** roles directly — Educators are assigned by Organisation Admins within their org, and all new accounts receive the Learner role automatically on signup.

---

## Navigation Summary

The sidebar shows only the links your role gives you access to:

| Link | Visible to |
|---|---|
| **Courses** | Everyone |
| **Educator** | Educator, Community Admin |
| **Organisational Admin** | Organisation Admin |
| **Community Admin** | Community Admin |
| **Platform Admin** | Platform Admin |

If a link does not appear in your sidebar, your account has not been assigned that role. Contact your organisation admin or platform admin to request access.
