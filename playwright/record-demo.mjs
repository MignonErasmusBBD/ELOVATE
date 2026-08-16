/**
 * Full ELOVATE demo — single continuous recording.
 *
 * Student:  sign-in → lesson content → full quiz (all questions + scorecard scroll)
 *           → student dashboard (trend, Bloom/Section tabs, highlights, recommendations)
 * Educator: overview (full scroll) → practice insights (scroll to question success rates)
 *           → students (view detail — full modal scroll incl. breakdown tabs + highlights)
 *           → questions (edit modal scroll)
 *           → learning content (edit section modal scroll)
 *
 * Run from /tmp/screenshots-tool/ via WSL:
 *   cd /tmp/screenshots-tool && node.exe record-demo.mjs
 */

import { chromium } from "./node_modules/playwright/index.mjs";
import { mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import pgPkg from "./node_modules/pg/lib/index.js";
const { Pool } = pgPkg;

// Hardcoded Windows path — node.exe (Windows) can write to C:\ directly
const repoRoot = "C:\\Users\\bbdnet3018\\Documents\\Hackathon\\2026\\ELOVATE";
const videoDir = join(repoRoot, "playwright", "videos");
await mkdir(videoDir, { recursive: true });

const COURSE_ID = "c0000000-0000-4000-8000-000000000001";
const BASE = "http://localhost:3000";
const DB_URL = "postgresql://elovate:elovate@localhost:5433/elovate";
const DEMO_EMAIL = `demo-video-${Date.now()}@elovate.test`;
const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Alex Chen";
const REAL_USER_ID = "9e31656f-d908-4312-b872-7194c8c5226e";

// ── Step 1: Sign up demo user ──────────────────────────────────────────────────
console.log("Signing up demo user…");
const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Origin": BASE },
  redirect: "manual",
  body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME }),
});
const signupBody = await signupRes.json().catch(() => ({}));
const DEMO_USER_ID = signupBody?.user?.id ?? signupBody?.id;
console.log("  User ID:", DEMO_USER_ID);

// ── Step 2: DB setup ──────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: DB_URL });
if (DEMO_USER_ID) {
  console.log("Setting up roles and data…");

  // educator(4) + community_admin(2)
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id) VALUES ($1, 4), ($1, 2)
    ON CONFLICT DO NOTHING
  `, [DEMO_USER_ID]);

  await pool.query(`
    INSERT INTO enrollments (user_id, course_id, is_required, due_at, enrollment_status_id)
    VALUES ($1, $2, true, NOW() + INTERVAL '7 days', 1)
    ON CONFLICT DO NOTHING
  `, [DEMO_USER_ID, COURSE_ID]);

  // Copy all completed quiz history from the real user
  const attempts = await pool.query(`SELECT * FROM quiz_attempts WHERE user_id = $1`, [REAL_USER_ID]);
  for (const a of attempts.rows) {
    const newId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO quiz_attempts
        (id, user_id, course_id, generated_at, started_at, completed_at,
         quiz_attempt_status_id, rating_at_generation, rating_at_completion)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT DO NOTHING
    `, [newId, DEMO_USER_ID, a.course_id, a.generated_at, a.started_at,
        a.completed_at, a.quiz_attempt_status_id, a.rating_at_generation, a.rating_at_completion]);

    const items = await pool.query(
      `SELECT * FROM quiz_attempt_items WHERE quiz_attempt_id = $1`, [a.id]
    );
    for (const item of items.rows) {
      await pool.query(`
        INSERT INTO quiz_attempt_items
          (id, quiz_attempt_id, question_id, selected_option_id, is_correct,
           answered_at, question_started_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
      `, [crypto.randomUUID(), newId, item.question_id, item.selected_option_id,
          item.is_correct, item.answered_at, item.question_started_at]);
    }
  }

  // Look up completed status ID
  const statusRow = await pool.query(
    `SELECT id FROM quiz_attempt_statuses WHERE name ILIKE 'completed' LIMIT 1`
  ).catch(() => ({ rows: [] }));
  const completedStatusId = statusRow.rows[0]?.id ?? 3;

  // Add 10 synthetic completed attempts spread over 30 days so trend chart renders
  // Ratings climb from ~1150 to ~1310 with a realistic wobble
  const syntheticRatings = [1150, 1170, 1145, 1190, 1210, 1195, 1230, 1255, 1240, 1280];
  const now = new Date();
  for (let i = 0; i < syntheticRatings.length; i++) {
    const daysAgo = 30 - i * 3; // every 3 days, oldest first
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const ratingGen = syntheticRatings[i];
    const ratingComp = i < syntheticRatings.length - 1 ? syntheticRatings[i + 1] : ratingGen + 20;
    await pool.query(`
      INSERT INTO quiz_attempts
        (id, user_id, course_id, generated_at, started_at, completed_at,
         quiz_attempt_status_id, rating_at_generation, rating_at_completion)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT DO NOTHING
    `, [
      crypto.randomUUID(), DEMO_USER_ID, COURSE_ID,
      date,
      new Date(date.getTime() + 2 * 60 * 1000),
      new Date(date.getTime() + 12 * 60 * 1000),
      completedStatusId, ratingGen, ratingComp,
    ]);
  }

  // Copy mastery tables so Bloom/Section/Difficulty breakdown tabs render
  const sectionMastery = await pool.query(`SELECT * FROM student_section_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of sectionMastery.rows) {
    await pool.query(`
      INSERT INTO student_section_mastery
        (user_id, course_id, course_section_id, questions_answered, correct_count)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_id, m.course_section_id, m.questions_answered, m.correct_count]);
  }

  const bloomMastery = await pool.query(`SELECT * FROM student_bloom_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of bloomMastery.rows) {
    await pool.query(`
      INSERT INTO student_bloom_mastery
        (user_id, course_id, bloom_level_id, questions_answered, correct_count)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_id, m.bloom_level_id, m.questions_answered, m.correct_count]);
  }

  const diffMastery = await pool.query(`SELECT * FROM student_difficulty_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of diffMastery.rows) {
    await pool.query(`
      INSERT INTO student_difficulty_mastery
        (user_id, course_id, difficulty_level_id, questions_answered, correct_count)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_id, m.difficulty_level_id, m.questions_answered, m.correct_count]);
  }

  const profile = await pool.query(`SELECT * FROM student_course_profile WHERE user_id = $1`, [REAL_USER_ID]);
  for (const p of profile.rows) {
    await pool.query(`
      INSERT INTO student_course_profile (user_id, course_id, current_rating)
      VALUES ($1,$2,$3) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, p.course_id, p.current_rating]);
  }

  console.log("  ✓ Roles, enrollment, quiz history (real + synthetic) ready");
} else {
  console.warn("  ⚠ No user ID from signup — skipping DB setup");
}
await pool.end();

// ── Helpers ────────────────────────────────────────────────────────────────────
async function scrollAndPause(page, amount, delay = 1000) {
  await page.mouse.wheel(0, amount);
  await page.waitForTimeout(delay);
}

// Scroll inside a modal by moving mouse to modal center first
async function scrollModal(page, amount, delay = 900) {
  const modal = page.locator("[role='dialog']").first();
  const box = await modal.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.mouse.wheel(0, amount);
  await page.waitForTimeout(delay);
}

// Click a tab by text and wait for it to settle
async function clickTab(page, text, waitMs = 1800) {
  const tab = page.locator("button").filter({ hasText: new RegExp(text, "i") }).first();
  if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(waitMs);
    return true;
  }
  return false;
}

// ── Step 3: Launch browser and record ─────────────────────────────────────────
console.log("\nLaunching Playwright…");
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
page.on("dialog", d => d.accept().catch(() => {}));

// ── Login ──────────────────────────────────────────────────────────────────────
console.log("Logging in via UI…");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(1500);
await page.locator("input[type='email']").first().fill(DEMO_EMAIL);
await page.waitForTimeout(400);
await page.locator("input[type='password']").first().fill(DEMO_PASSWORD);
await page.waitForTimeout(500);
await page.locator("button[type='submit']").first().click();
await page.waitForURL(/\/(student|educator|community|dashboard|courses)/, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);
console.log("  ✓ Logged in →", page.url());

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT FLOW
// ══════════════════════════════════════════════════════════════════════════════

// ── Lesson / Course content ────────────────────────────────────────────────────
console.log("\n[Student] Lesson page…");
await page.goto(`${BASE}/student/courses/${COURSE_ID}`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2500);
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, -1500, 1200);

// ── Quiz — complete all 10 questions ─────────────────────────────────────────
console.log("[Student] Quiz — starting…");
await page.goto(`${BASE}/student/courses/${COURSE_ID}/quiz`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2000);

const startBtn = page.locator("button").filter({ hasText: /start|begin|generate/i }).first();
if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await startBtn.click();
  await page.waitForTimeout(4500);
}

for (let i = 0; i < 10; i++) {
  const label = page.locator("fieldset label").first();
  if (!await label.isVisible({ timeout: 8000 }).catch(() => false)) {
    console.log(`  Quiz: no label visible at Q${i + 1} — stopping`);
    break;
  }

  await label.click();
  await page.waitForTimeout(600);

  const submitAnswerBtn = page.locator("button").filter({ hasText: /submit answer/i }).first();
  if (await submitAnswerBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
    await submitAnswerBtn.click();
    await page.waitForTimeout(1800); // show feedback
  }

  const nextBtn = page.locator("button").filter({ hasText: /next question/i }).first();
  const submitQuizBtn = page.locator("button").filter({ hasText: /submit quiz/i }).first();

  const hasNext = await nextBtn.isVisible({ timeout: 1000 }).catch(() => false);
  const hasSubmit = await submitQuizBtn.isVisible({ timeout: 1000 }).catch(() => false);

  if (hasNext) {
    await nextBtn.click();
    await page.waitForTimeout(1200);
  } else if (hasSubmit) {
    await submitQuizBtn.click();
    await page.waitForTimeout(3000);
    break;
  } else {
    console.log(`  Quiz: no nav button at Q${i + 1} — stopping`);
    break;
  }
}

// Ensure quiz is submitted if loop exited mid-quiz
const finalSubmit = page.locator("button").filter({ hasText: /submit quiz/i }).first();
if (await finalSubmit.isVisible({ timeout: 2000 }).catch(() => false)) {
  await finalSubmit.click();
  await page.waitForTimeout(3000);
}

// ── Scroll through quiz scorecard / results ───────────────────────────────────
console.log("[Student] Quiz scorecard…");
await page.waitForTimeout(2000);
await scrollAndPause(page, 400, 1200);
await scrollAndPause(page, 400, 1200);
await scrollAndPause(page, -800, 1200);

// ── Student Dashboard — all sections ─────────────────────────────────────────
console.log("[Student] Dashboard…");
const dashLink = page.locator("a").filter({ hasText: /dashboard/i }).first();
if (await dashLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  await dashLink.click();
  await page.waitForURL(/dashboard/, { timeout: 8000 }).catch(() => {});
} else {
  await page.goto(`${BASE}/student/courses/${COURSE_ID}/dashboard`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
}
await page.waitForSelector("canvas, main", { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(3000); // let all charts render

// Summary cards + trend chart
await scrollAndPause(page, 400, 1200);
await scrollAndPause(page, 400, 1200);

// BreakdownTabs — click through Bloom / Section / Difficulty
await clickTab(page, "^bloom$", 1800);
await scrollAndPause(page, 200, 800);
await clickTab(page, "^section$", 1800);
await scrollAndPause(page, 200, 800);
await clickTab(page, "^difficulty$", 1800);
await scrollAndPause(page, 200, 800);

// Continue scrolling to GrowthHighlights and Recommendations
await scrollAndPause(page, 450, 1200);
await scrollAndPause(page, 450, 1200);
await scrollAndPause(page, 450, 1200);

// Scroll back to top
await scrollAndPause(page, -2500, 1500);

// ══════════════════════════════════════════════════════════════════════════════
// EDUCATOR FLOW
// ══════════════════════════════════════════════════════════════════════════════

console.log("\n[Educator] Navigating to dashboard…");
await page.goto(`${BASE}/educator`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2000);

// Switch to Community filter so the Python course appears
const communityBtn = page.locator("button[aria-pressed]").filter({ hasText: /community/i }).first();
if (await communityBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await communityBtn.click();
  await page.waitForTimeout(1500);
}

// Select Python course
const courseSelect = page.locator("select").first();
if (await courseSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
  await courseSelect.selectOption({ value: COURSE_ID });
  await page.waitForTimeout(2500);
}

// ── Overview tab ──────────────────────────────────────────────────────────────
console.log("[Educator] Overview tab…");
await clickTab(page, "^overview$", 2000);
await page.waitForSelector("canvas", { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2000);
await scrollAndPause(page, 450, 1200);
await scrollAndPause(page, 450, 1200);
await scrollAndPause(page, 450, 1200);
await scrollAndPause(page, -1350, 1200);

// ── Practice Insights tab (scroll through all 3 sections incl. question insights)
console.log("[Educator] Practice Insights…");
await clickTab(page, "practice insight", 2500);
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, 500, 1200);
// Section 2: Score distribution
await scrollAndPause(page, 500, 1200);
// Section 3: Question success rates (question insights)
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, 500, 1200);
await scrollAndPause(page, -2500, 1200);

// ── Students tab ──────────────────────────────────────────────────────────────
console.log("[Educator] Students…");
await clickTab(page, "^students$", 2000);
await scrollAndPause(page, 300, 800);

const viewDetailsBtn = page.locator("button").filter({ hasText: /view details/i }).first();
if (await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await viewDetailsBtn.click();
  await page.waitForTimeout(2500);

  // Header + metric cards
  await scrollModal(page, 350, 1000);
  // AttemptsTrendChart
  await scrollModal(page, 350, 1200);
  // Recommendations
  await scrollModal(page, 350, 1000);
  // BreakdownTabs — click Bloom / Section / Difficulty inside modal
  await clickTab(page, "^bloom$", 1500);
  await scrollModal(page, 200, 800);
  await clickTab(page, "^section$", 1500);
  await scrollModal(page, 200, 800);
  await clickTab(page, "^difficulty$", 1500);
  await scrollModal(page, 200, 800);
  // GrowthHighlights
  await scrollModal(page, 400, 1200);
  // Scroll back to top of modal
  await scrollModal(page, -2000, 1000);

  const closeModal = page.locator("button[aria-label='Close student details']").first();
  if (await closeModal.isVisible().catch(() => false)) {
    await closeModal.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(1200);
}
await scrollAndPause(page, -300, 800);

// ── Questions tab ─────────────────────────────────────────────────────────────
console.log("[Educator] Questions…");
await clickTab(page, "^questions$", 2000);
await scrollAndPause(page, 350, 1000);

const editQuestionBtn = page.locator("button").filter({ hasText: /edit question/i }).first();
if (await editQuestionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await editQuestionBtn.click();
  await page.waitForTimeout(2000);
  await scrollModal(page, 400, 1000);
  await scrollModal(page, 400, 1000);
  await scrollModal(page, -800, 800);
  const cancelBtn = page.locator("button").filter({ hasText: /^cancel$/i }).first();
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(1200);
}
await scrollAndPause(page, -350, 800);

// ── Learning Content tab ──────────────────────────────────────────────────────
console.log("[Educator] Learning Content…");
await clickTab(page, "learning content", 2000);
await scrollAndPause(page, 200, 800);

// Expand first section accordion
const sectionToggle = page.locator("button").filter({ hasText: /variable|control|function|object/i }).first();
if (await sectionToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
  await sectionToggle.click();
  await page.waitForTimeout(1200);
}

const editSectionBtn = page.locator("button").filter({ hasText: /edit section/i }).first();
if (await editSectionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  await editSectionBtn.click();
  await page.waitForTimeout(2000);
  await scrollModal(page, 450, 1000);
  await scrollModal(page, 450, 1000);
  await scrollModal(page, -900, 800);
  const cancelSectionBtn = page.locator("button").filter({ hasText: /^cancel$/i }).first();
  if (await cancelSectionBtn.isVisible().catch(() => false)) {
    await cancelSectionBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(1200);
}

await scrollAndPause(page, 300, 1000);
await scrollAndPause(page, -300, 1000);
await page.waitForTimeout(2000);

// ── Save video ─────────────────────────────────────────────────────────────────
const videoPath = await page.video()?.path();
await ctx.close();
await browser.close();

if (videoPath) {
  const dest = join(videoDir, "full-demo.webm");
  await copyFile(videoPath, dest).catch(async () => {
    await new Promise(r => setTimeout(r, 1500));
    await copyFile(videoPath, dest).catch(console.error);
  });
  console.log(`\n✓ Video saved → assets/videos/full-demo.webm`);
} else {
  console.error("✗ No video path captured");
}
