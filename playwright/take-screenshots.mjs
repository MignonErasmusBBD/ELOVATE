/**
 * Screenshot + video capture script for the ELOVATE pitch deck.
 *
 * Workflow:
 *  1. Sign up a demo user via Better Auth API → get valid signed session cookie
 *  2. Grant that user educator + org_admin roles and enroll them in the Python course
 *  3. Copy over the existing quiz attempt data from the real user (xadrian) so dashboards are populated
 *  4. Use Playwright with the real session cookie to screenshot every pitch slide
 *  5. Record short webm videos of key flows
 */

import { chromium } from "playwright";
import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "/tmp/screenshots-tool/node_modules/pg/lib/index.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, "..");
const outDir = join(repoRoot, "playwright", "screenshots");
const videoDir = join(repoRoot, "playwright", "videos");
await mkdir(outDir, { recursive: true });
await mkdir(videoDir, { recursive: true });

const COURSE_ID = "c0000000-0000-4000-8000-000000000001";
const BASE = "http://localhost:3000";
const DB_URL = "postgresql://elovate:elovate@localhost:5433/elovate";
const DEMO_EMAIL = `demo-pitch-${Date.now()}@elovate.test`;
const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Alex Chen";

// ── Step 1: Sign up demo user via Better Auth ──────────────────────────────
console.log("Signing up demo user via Better Auth…");
const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  redirect: "manual",
  body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME }),
});

const rawSetCookie = signupRes.headers.get("set-cookie") ?? "";
console.log("  set-cookie:", rawSetCookie.slice(0, 100));

// Extract the signed cookie value — format: better-auth.session_token=<value>; ...
const cookieMatch = rawSetCookie.match(/better-auth\.session_token=([^;]+)/);
if (!cookieMatch) {
  console.error("  ✗ Could not extract session cookie. Response status:", signupRes.status);
  const body = await signupRes.text();
  console.error("  body:", body.slice(0, 300));
  process.exit(1);
}
const SESSION_COOKIE_VALUE = cookieMatch[1];
console.log("  ✓ Session cookie captured:", SESSION_COOKIE_VALUE.slice(0, 30) + "…");

const signupBody = await signupRes.json().catch(() => ({}));
const DEMO_USER_ID = signupBody?.user?.id ?? signupBody?.id;
console.log("  User ID:", DEMO_USER_ID);

// ── Step 2: Wire up roles, enrollment, and copy quiz data ──────────────────
const pool = new Pool({ connectionString: DB_URL });

if (DEMO_USER_ID) {
  console.log("Setting up demo user data in DB…");
  // Add educator + org_admin roles (learner already granted by auth hook)
  await pool.query(`
    INSERT INTO user_roles (user_id, role_id) VALUES
      ($1, 4),  -- educator
      ($1, 3)   -- org_admin
    ON CONFLICT DO NOTHING
  `, [DEMO_USER_ID]);

  // Find the demo org (ELOVATE Demo) and link user to it
  const orgRow = await pool.query(`SELECT org_id FROM organizations LIMIT 1`).catch(() => ({ rows: [] }));
  const ORG_ID = orgRow.rows[0]?.org_id;

  // Enroll in Python course as mandatory (due today so overdue shows)
  await pool.query(`
    INSERT INTO enrollments (user_id, course_id, is_required, due_at, enrollment_status_id)
    VALUES ($1, $2, true, NOW() + INTERVAL '7 days', 1)
    ON CONFLICT DO NOTHING
  `, [DEMO_USER_ID, COURSE_ID]);

  // Copy quiz attempts from the real user so the student dashboard has data
  const REAL_USER_ID = "9e31656f-d908-4312-b872-7194c8c5226e";
  const attempts = await pool.query(`SELECT * FROM quiz_attempts WHERE user_id = $1`, [REAL_USER_ID]);
  for (const a of attempts.rows) {
    const newAttemptId = crypto.randomUUID();
    await pool.query(`
      INSERT INTO quiz_attempts (id, user_id, course_id, generated_at, started_at, completed_at, quiz_attempt_status_id, rating_at_generation, rating_at_completion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
    `, [newAttemptId, DEMO_USER_ID, a.course_id, a.generated_at, a.started_at, a.completed_at, a.quiz_attempt_status_id, a.rating_at_generation, a.rating_at_completion]);

    // Copy the items
    const items = await pool.query(`SELECT * FROM quiz_attempt_items WHERE quiz_attempt_id = $1`, [a.id]);
    for (const item of items.rows) {
      await pool.query(`
        INSERT INTO quiz_attempt_items (id, quiz_attempt_id, question_id, selected_option_id, is_correct, answered_at, time_taken_seconds)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [crypto.randomUUID(), newAttemptId, item.question_id, item.selected_option_id, item.is_correct, item.answered_at, item.time_taken_seconds]);
    }
  }

  // Copy mastery data
  const sectionMastery = await pool.query(`SELECT * FROM student_section_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of sectionMastery.rows) {
    await pool.query(`
      INSERT INTO student_section_mastery (user_id, course_section_id, questions_answered, correct_count)
      VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_section_id, m.questions_answered, m.correct_count]);
  }

  const bloomMastery = await pool.query(`SELECT * FROM student_bloom_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of bloomMastery.rows) {
    await pool.query(`
      INSERT INTO student_bloom_mastery (user_id, course_id, bloom_level_id, questions_answered, correct_count)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_id, m.bloom_level_id, m.questions_answered, m.correct_count]);
  }

  const diffMastery = await pool.query(`SELECT * FROM student_difficulty_mastery WHERE user_id = $1`, [REAL_USER_ID]);
  for (const m of diffMastery.rows) {
    await pool.query(`
      INSERT INTO student_difficulty_mastery (user_id, course_id, difficulty_level_id, questions_answered, correct_count)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, m.course_id, m.difficulty_level_id, m.questions_answered, m.correct_count]);
  }

  const profile = await pool.query(`SELECT * FROM student_course_profile WHERE user_id = $1`, [REAL_USER_ID]);
  for (const p of profile.rows) {
    await pool.query(`
      INSERT INTO student_course_profile (user_id, course_id, current_rating)
      VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
    `, [DEMO_USER_ID, p.course_id, p.current_rating]);
  }

  console.log("  ✓ Roles, enrollment, quiz data set up");
} else {
  console.warn("  ⚠ No user ID from signup — skipping DB setup");
}

await pool.end();

// ── Step 3: Screenshot + video helper ────────────────────────────────────────
const browser = await chromium.launch({ headless: true });

function makeCookies() {
  return [
    {
      name: "better-auth.session_token",
      value: SESSION_COOKIE_VALUE,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ];
}

async function shot(name, url, { waitFor, afterLoad, width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  await ctx.addCookies(makeCookies());
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {});
  if (afterLoad) await afterLoad(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
  console.log(`  ✓ screenshots/${name}.png`);
  await ctx.close();
}

async function record(name, url, script, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    recordVideo: { dir: videoDir, size: { width, height } },
  });
  await ctx.addCookies(makeCookies());
  const page = await ctx.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await script(page);
  await page.waitForTimeout(500);
  const videoPath = await page.video()?.path();
  await ctx.close(); // video is saved on close
  if (videoPath) {
    const dest = join(videoDir, `${name}.webm`);
    await copyFile(videoPath, dest).catch(async () => {
      // wait briefly then retry
      await new Promise(r => setTimeout(r, 1000));
      await copyFile(videoPath, dest).catch(() => {});
    });
    console.log(`  ✓ videos/${name}.webm`);
  }
}

// ── Step 4: Take screenshots ─────────────────────────────────────────────────
console.log("\nCapturing screenshots…");

// 01 — Login page (no auth needed)
await shot("01-login", "/login", { waitFor: "form" });

// 02 — Student dashboard
await shot("02-student-dashboard",
  `/student/courses/${COURSE_ID}/dashboard`,
  { waitFor: "canvas, [class*='chart'], [class*='Chart'], [class*='trend'], main" });

// 03 — Lesson reading (accessibility toolbar)
await shot("03-lesson-reading",
  `/student/courses/${COURSE_ID}`,
  { waitFor: "main" });

// 04 — Quiz page (start card)
await shot("04-quiz",
  `/student/courses/${COURSE_ID}/quiz`,
  { waitFor: "main" });

// 05 — Educator overview
await shot("05-educator-overview", "/educator", {
  waitFor: "canvas, main",
  afterLoad: async (p) => {
    const tab = p.locator("button, [role='tab']").filter({ hasText: /overview/i }).first();
    if (await tab.isVisible().catch(() => false)) { await tab.click(); await p.waitForTimeout(1200); }
  },
});

// 06 — Educator practice insights
await shot("06-educator-insights", "/educator", {
  waitFor: "canvas, main",
  afterLoad: async (p) => {
    const tab = p.locator("button, [role='tab']").filter({ hasText: /practice insight/i }).first();
    if (await tab.isVisible().catch(() => false)) { await tab.click(); await p.waitForTimeout(1200); }
  },
});

// 07 — Educator students (mandatory/overdue badges)
await shot("07-educator-students", "/educator", {
  waitFor: "main",
  afterLoad: async (p) => {
    const tab = p.locator("button, [role='tab']").filter({ hasText: /student/i }).first();
    if (await tab.isVisible().catch(() => false)) { await tab.click(); await p.waitForTimeout(1000); }
  },
});

// 08 — Community page
await shot("08-community", "/community", { waitFor: "main" });

// ── Step 5: Record videos ─────────────────────────────────────────────────────
console.log("\nRecording videos…");

// Video 1 — Brand + login page pan
await record("v01-login-brand", "/login", async (page) => {
  await page.waitForSelector("form", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);
  // Type into email to show interaction
  const emailInput = page.locator("input[type='email']").first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.click();
    await page.keyboard.type(DEMO_EMAIL, { delay: 60 });
    await page.waitForTimeout(800);
  }
});

// Video 2 — Student dashboard scroll
await record("v02-student-dashboard",
  `/student/courses/${COURSE_ID}/dashboard`, async (page) => {
    await page.waitForSelector("canvas, main", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(800);
  });

// Video 3 — Lesson reading + accessibility toggles
await record("v03-accessibility", `/student/courses/${COURSE_ID}`, async (page) => {
  await page.waitForSelector("main", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  // Try clicking font size buttons
  const largeFontBtn = page.locator("button").filter({ hasText: /large|L/i }).first();
  if (await largeFontBtn.isVisible().catch(() => false)) {
    await largeFontBtn.click(); await page.waitForTimeout(800);
  }
  // Try contrast toggle
  const contrastBtn = page.locator("button").filter({ hasText: /contrast|dark|high/i }).first();
  if (await contrastBtn.isVisible().catch(() => false)) {
    await contrastBtn.click(); await page.waitForTimeout(800);
    await contrastBtn.click(); await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1000);
});

// Video 4 — Educator dashboard tab switching
await record("v04-educator-tabs", "/educator", async (page) => {
  await page.waitForSelector("main", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const tabs = ["practice insight", "students", "questions", "overview"];
  for (const label of tabs) {
    const tab = page.locator("button, [role='tab']").filter({ hasText: new RegExp(label, "i") }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1200);
    }
  }
});

// Video 5 — Quiz start flow
await record("v05-quiz", `/student/courses/${COURSE_ID}/quiz`, async (page) => {
  await page.waitForSelector("main", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  // Click start quiz button if visible
  const startBtn = page.locator("button").filter({ hasText: /start.*quiz|begin|generate/i }).first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(3000);
    // If we get to a question, show it
    await page.waitForSelector("[class*='question'], [class*='Question']", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
});

await browser.close();
console.log("\n✓ All done! Screenshots → assets/screenshots/ | Videos → assets/videos/");
