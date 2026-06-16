/**
 * demo-screencast.spec.js
 *
 * Full DMS Demo Screencast — run once; add your voice narration over the video.
 *
 *  slowMo: 800 ms  |  browser visible  |  video always recorded
 *  Video saved to: test-results/demo-screencast-…/video.webm
 *
 * Prerequisites (ONE of):
 *   npm run dev:full          → starts Vite (:5173) + json-server (:3001)
 *   npx playwright test ...   → playwright.config.js launches both automatically
 *
 * Run:
 *   npx playwright test e2e/demo-screencast.spec.js --reporter=list
 *
 * Architecture note:
 *   The full Docker backend (API Gateway :8080, auth-service :8083, …) is NOT
 *   required. Playwright intercepts /auth/login, /api/documents, and
 *   /api/comments requests and proxies them to json-server (:3001), so the
 *   entire demo runs with just the React dev server and json-server.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Screencast overrides ────────────────────────────────────────────────────
test.use({
  headless: false,
  launchOptions: { slowMo: 800 },
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
  actionTimeout: 20000,
});

// ─── Constants ───────────────────────────────────────────────────────────────
const API   = 'http://localhost:3001';
const DEMO_PDF = path.join(__dirname, 'fixtures', 'demo.pdf');

const ADMIN = { email: 'admin@dms.com',  password: 'admin123' };
const U1    = { email: 'u1@ensia.dz',    password: 'Password1!', firstName: 'Alice', lastName: 'IT' };
const U2    = { email: 'u2@ensia.dz',    password: 'Password1!', firstName: 'Bob',   lastName: 'Finance' };
const U3    = { email: 'u3@ensia.dz',    password: 'Password1!', firstName: 'Carol', lastName: 'Both' };

// ─── Shared state used by RBAC mock ─────────────────────────────────────────
let currentUser = null;

// ─── Route interception setup ────────────────────────────────────────────────
/**
 * Call once at the very start of the test.
 * Sets up three route mocks so the demo runs without the Docker backend:
 *   1. POST /auth/login   → validates against json-server, returns mock JWT
 *   2. /api/documents/**  → proxied to json-server (with client-side RBAC)
 *   3. /api/comments/**   → proxied to json-server
 */
async function setupRouteMocks(page) {

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  await page.route(/\/auth\/login/, async (route) => {
    const raw = route.request().postData() || '{}';
    const { email, password } = JSON.parse(raw);

    const res  = await page.request.get(`${API}/users?email=${encodeURIComponent(email)}`);
    const list = await res.json();
    const user = list.find(u => u.email === email && u.password === password);

    if (user) {
      const { password: _pw, ...safeUser } = user;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...safeUser, token: `demo-jwt-${user.id}` }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    }
  });

  // ── 2. Documents ─────────────────────────────────────────────────────────
  await page.route(/\/api\/documents/, async (route) => {
    const url    = route.request().url();
    const method = route.request().method();

    // Extract everything after "/api/documents"
    const afterDocs = url.split('/api/documents')[1] || '';
    // First path segment after the slash → document ID (empty if listing endpoint)
    const docId = afterDocs.split('/').filter(Boolean)[0] || null;

    if (method === 'GET' && !docId) {
      // GET /api/documents — return all docs, filtered by user's departments (RBAC)
      const res  = await page.request.get(`${API}/documents`);
      let docs   = await res.json();

      if (currentUser && currentUser.role !== 'admin' && currentUser.departments?.length) {
        docs = docs.filter(d =>
          !d.departmentId || currentUser.departments.includes(d.departmentId)
        );
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(docs),
      });

    } else if (method === 'GET' && docId) {
      // GET /api/documents/:id
      const res = await page.request.get(`${API}/documents/${docId}`);
      await route.fulfill({
        status: res.status(),
        contentType: 'application/json',
        body: await res.text(),
      });

    } else if (method === 'POST') {
      // POST /api/documents — the test pre-saves the doc; just ack the request
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });

    } else if (method === 'PATCH' && docId) {
      // PATCH /api/documents/:id — increment view/download count, translations, etc.
      const body = route.request().postDataJSON() || {};
      const res  = await page.request.patch(`${API}/documents/${docId}`, {
        data: body,
        headers: { 'Content-Type': 'application/json' },
      });
      await route.fulfill({
        status: res.status(),
        contentType: 'application/json',
        body: await res.text(),
      });

    } else {
      await route.continue();
    }
  });

  // ── 3. Comments ──────────────────────────────────────────────────────────
  await page.route(/\/api\/comments/, async (route) => {
    const url    = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.includes('/document/')) {
      // GET /api/comments/document/:documentId
      const documentId = url.split('/document/')[1].split('?')[0];
      const res = await page.request.get(`${API}/comments?documentId=${documentId}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: await res.text(),
      });

    } else if (method === 'POST') {
      // POST /api/comments — save to json-server
      const body       = route.request().postDataJSON() || {};
      const newComment = { ...body, id: Math.random().toString(36).substr(2, 9) };
      const res        = await page.request.post(`${API}/comments`, {
        data: newComment,
        headers: { 'Content-Type': 'application/json' },
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: await res.text(),
      });

    } else {
      await route.continue();
    }
  });
}

// ─── Test helpers ────────────────────────────────────────────────────────────

async function loginAs(page, credentials) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/(\/documents|\/admin)/, { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  // Update currentUser so the document RBAC mock knows who is logged in
  const raw = await page.evaluate(() => localStorage.getItem('dms_user'));
  currentUser = raw ? JSON.parse(raw) : null;
}

async function logoutUser(page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login', { timeout: 10000 });
  currentUser = null;
  await page.waitForTimeout(400);
}

async function waitForToast(page, text) {
  // Soft wait — toast might have already auto-dismissed by the time we check
  try {
    await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 8000 });
  } catch { /* toast was too fast — that's OK */ }
}

async function createDepartment(page, name) {
  await page.getByRole('button', { name: /Add Department/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.getByRole('button', { name: /Create Department/i }).click();
  await waitForToast(page, 'created');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForTimeout(500);
}

async function createCategory(page, name) {
  await page.getByRole('button', { name: /Add Category/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.getByRole('button', { name: /Create Category/i }).click();
  await waitForToast(page, 'created');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForTimeout(500);
}

/**
 * Creates a user via the admin Users page (must already be open).
 * @param {string[]} deptNames  Department display names to select in the MultiSelect.
 */
async function createUser(page, userData, deptNames = []) {
  await page.getByRole('button', { name: /add user/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });

  await dialog.locator('input[name="firstName"]').fill(userData.firstName);
  await dialog.locator('input[name="lastName"]').fill(userData.lastName);
  await dialog.locator('input[name="email"]').fill(userData.email);

  // Department MultiSelect
  if (deptNames.length > 0) {
    await dialog.getByText('Select departments...').click();
    await page.waitForTimeout(400);
    for (const name of deptNames) {
      await dialog.locator('ul li').filter({ hasText: name }).first().click();
      await page.waitForTimeout(300);
    }
    // Close the dropdown by clicking a field ABOVE the MultiSelect (firstName is at the
    // top of the form and cannot be covered by the absolute-positioned dropdown).
    // Avoid clicking the password field — it sits below the dropdown and force-clicking
    // it would hit the dropdown overlay instead, accidentally toggling a department off.
    await dialog.locator('input[name="firstName"]').click();
    await page.waitForTimeout(400);
  }

  await dialog.locator('input[name="password"]').fill(userData.password);
  await dialog.locator('input[name="confirmPassword"]').fill(userData.password);
  await dialog.getByRole('button', { name: /create user/i }).click();
  await waitForToast(page, 'User created');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForTimeout(500);
}

/**
 * Uploads a document via the Upload Document modal (must be on /documents).
 *
 * Because the real Spring Boot documents service isn't running, this helper:
 *   1. Fills the form fields
 *   2. Reads the chosen category/department IDs directly from the select elements
 *   3. PRE-SAVES the complete document record to json-server via page.request
 *   4. Clicks "Upload" — the POST mock returns 201 so the modal closes cleanly
 *   5. fetchDocuments() then finds the pre-saved record and refreshes the list
 */
async function uploadDocument(page, { title, categoryLabel, departmentLabel, statusLabel }) {
  // ── Step 1: Open modal and attach file ───────────────────────────────────
  await page.getByRole('button', { name: /upload document/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });

  await dialog.locator('input[type="file"]').setInputFiles(DEMO_PDF);
  await page.waitForTimeout(700);
  await dialog.getByRole('button', { name: /next/i }).click();

  // ── Step 2: Fill metadata ────────────────────────────────────────────────
  await dialog.locator('input[name="title"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(500); // let category / department options load

  await dialog.locator('input[name="title"]').fill(title);

  // Category (has explicit name="categoryId")
  await dialog.locator('select[name="categoryId"]').selectOption({ label: categoryLabel });

  // Department (2nd <select> inside the 2-column grid — no name attribute)
  await dialog.locator('div.grid').locator('select').nth(1).selectOption({ label: departmentLabel });

  // Status (last <select> in the step-2 form)
  await dialog.locator('select').last().selectOption({ label: statusLabel });

  // ── Read the selected IDs before clicking Upload ──────────────────────────
  const categoryId = await dialog.locator('select[name="categoryId"]').evaluate(el => el.value);
  const deptId     = await dialog.locator('div.grid').locator('select').nth(1).evaluate(el => el.value);
  const statusVal  = await dialog.locator('select').last().evaluate(el => el.value);
  const userId     = await page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem('dms_user') || '{}');
    return u.id || '';
  });

  // ── Pre-save to json-server so fetchDocuments() finds the doc after upload ─
  const docId = Math.random().toString(36).substring(2, 9);
  const now   = new Date().toISOString();
  await page.request.post(`${API}/documents`, {
    data: {
      id:           docId,
      title,
      description:  '',
      categoryId,
      departmentId: deptId,
      tags:         [],
      fileUrl:      '/uploads/demo.pdf',
      fileName:     'demo.pdf',
      fileType:     'pdf',
      fileSize:     1024,
      status:       statusVal,
      uploadedBy:   userId,
      currentVersion: 1,
      versions: [{
        versionNumber: 1,
        fileUrl:       '/uploads/demo.pdf',
        uploadedBy:    userId,
        uploadedAt:    now,
        notes:         'Initial upload',
      }],
      createdAt:     now,
      updatedAt:     now,
      viewCount:     0,
      downloadCount: 0,
    },
    headers: { 'Content-Type': 'application/json' },
  });

  // ── Step 3: Click Upload; the POST mock acks immediately, modal closes ────
  await dialog.getByRole('button', { name: /^upload$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 25000 });
  await waitForToast(page, 'uploaded');
  await page.waitForTimeout(800);
}

// ─── Main test ───────────────────────────────────────────────────────────────

test('DMS Full Demo Screencast', async ({ page }) => {
  test.setTimeout(300_000); // 5-minute budget for the whole recording

  // Install route mocks FIRST — before any navigation
  await setupRouteMocks(page);

  // ══════════════════════════════════════════════════════════════════════════
  // PRE-FLIGHT: clean up any data left from a previous run so the demo
  //             flows cleanly every time it is recorded.
  // ══════════════════════════════════════════════════════════════════════════
  const [deptsRes, catsRes, usersRes, docsRes] = await Promise.all([
    page.request.get(`${API}/departments`),
    page.request.get(`${API}/categories`),
    page.request.get(`${API}/users`),
    page.request.get(`${API}/documents`),
  ]);

  const [depts, cats, users, docs] = await Promise.all([
    deptsRes.json(),
    catsRes.json(),
    usersRes.json(),
    docsRes.json(),
  ]);

  for (const d of depts) {
    if (['Finance', 'IT'].includes(d.name))
      await page.request.delete(`${API}/departments/${d.id}`);
  }
  for (const c of cats) {
    if (['General', 'Administrative', 'Training'].includes(c.name))
      await page.request.delete(`${API}/categories/${c.id}`);
  }
  for (const u of users) {
    if ([U1.email, U2.email, U3.email].includes(u.email))
      await page.request.delete(`${API}/users/${u.id}`);
  }
  for (const d of docs) {
    if (['IT Policy Document', 'Finance Report Q1'].includes(d.title))
      await page.request.delete(`${API}/documents/${d.id}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 1 — Admin logs in and creates two departments: Finance and IT
  // ══════════════════════════════════════════════════════════════════════════
  await loginAs(page, ADMIN);
  await page.goto('/admin/departments');
  await page.waitForLoadState('networkidle');

  await createDepartment(page, 'Finance');
  await createDepartment(page, 'IT');

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 2 — Admin creates three users and assigns them to departments
  //           u1 → IT   |   u2 → Finance   |   u3 → IT + Finance
  // ══════════════════════════════════════════════════════════════════════════
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  await createUser(page, U1, ['IT']);
  await createUser(page, U2, ['Finance']);
  await createUser(page, U3, ['IT', 'Finance']);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 3 — Admin creates three categories: General, Administrative, Training
  // ══════════════════════════════════════════════════════════════════════════
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');

  await createCategory(page, 'General');
  await createCategory(page, 'Administrative');
  await createCategory(page, 'Training');

  await logoutUser(page);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 4 — u1 logs in and creates a document in the IT department
  // ══════════════════════════════════════════════════════════════════════════
  await loginAs(page, U1);

  await uploadDocument(page, {
    title:           'IT Policy Document',
    categoryLabel:   'General',
    departmentLabel: 'IT',
    statusLabel:     'Published',
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 5 — u1 opens the document and adds a comment
  // ══════════════════════════════════════════════════════════════════════════
  await expect(page.getByText('IT Policy Document').first()).toBeVisible({ timeout: 10000 });
  await page.getByText('IT Policy Document').first().click();
  await page.waitForURL(/\/documents\/.+/);
  await page.waitForLoadState('networkidle');

  // Scroll to the Comments section (use role=heading to avoid partial-text matches)
  await page.getByRole('heading', { name: /Comments/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const commentBox = page.locator('textarea[placeholder*="Write a comment"]');
  await commentBox.scrollIntoViewIfNeeded();
  await commentBox.fill(
    'This IT policy document is essential for onboarding new team members. Please review it carefully.'
  );
  await page.getByRole('button', { name: /add comment/i }).click();
  await page.waitForTimeout(1500); // let the comment render in the thread

  await logoutUser(page);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 6 — u2 logs in and can only see documents in the Finance department
  //           (RBAC is enforced by the route mock; u1's IT doc is hidden)
  // ══════════════════════════════════════════════════════════════════════════
  await loginAs(page, U2);
  await page.waitForTimeout(2000); // let the viewer see the Finance-only library

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 7 — u2 creates a document in the Finance department
  // ══════════════════════════════════════════════════════════════════════════
  await uploadDocument(page, {
    title:           'Finance Report Q1',
    categoryLabel:   'Administrative',
    departmentLabel: 'Finance',
    statusLabel:     'Published',
  });

  await logoutUser(page);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 8 — u3 logs in, sees documents from both departments, downloads each
  // ══════════════════════════════════════════════════════════════════════════
  await loginAs(page, U3);
  await page.waitForTimeout(2000); // show the combined library

  // Download the IT document
  await expect(page.getByText('IT Policy Document').first()).toBeVisible({ timeout: 10000 });
  await page.getByText('IT Policy Document').first().click();
  await page.waitForURL(/\/documents\/.+/);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /^Download$/ }).first().click();
  await waitForToast(page, 'Download started');
  await page.waitForTimeout(1000);

  await page.goto('/documents');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);

  // Download the Finance document
  await expect(page.getByText('Finance Report Q1').first()).toBeVisible({ timeout: 15000 });
  await page.getByText('Finance Report Q1').first().click();
  await page.waitForURL(/\/documents\/.+/);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /^Download$/ }).first().click();
  await waitForToast(page, 'Download started');
  await page.waitForTimeout(1000);

  await logoutUser(page);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 9 — Simulate the Kafka/Gemini AI translation pipeline
  //           (inject translated fields directly via json-server REST API)
  // ══════════════════════════════════════════════════════════════════════════
  const freshRes = await page.request.get(`${API}/documents`);
  const allDocs  = await freshRes.json();
  const u1Doc    = allDocs.find(d => d.title === 'IT Policy Document');

  if (u1Doc) {
    await page.request.patch(`${API}/documents/${u1Doc.id}`, {
      data: {
        translatedContentFr:
          'Document de politique informatique\n\n' +
          'Ce document définit les règles et procédures du département IT, ' +
          'couvrant la gestion des accès, la sécurité des données et les ' +
          'bonnes pratiques opérationnelles.',
        translatedContentAr:
          'وثيقة سياسة تكنولوجيا المعلومات\n\n' +
          'تحدد هذه الوثيقة القواعد والإجراءات الخاصة بقسم تكنولوجيا المعلومات، ' +
          'وتشمل إدارة الوصول وأمن البيانات وأفضل الممارسات التشغيلية.',
        translatedContentEs:
          'Documento de política de TI\n\n' +
          'Este documento define las reglas y procedimientos del departamento de TI, ' +
          'cubriendo la gestión de accesos, la seguridad de datos y las ' +
          'buenas prácticas operacionales.',
      },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 10 — u1 logs back in and views the AI-translated document content
  // ══════════════════════════════════════════════════════════════════════════
  await loginAs(page, U1);

  await expect(page.getByText('IT Policy Document').first()).toBeVisible({ timeout: 10000 });
  await page.getByText('IT Policy Document').first().click();
  await page.waitForURL(/\/documents\/.+/);
  await page.waitForLoadState('networkidle');

  // Scroll to the AI Translations card (powered by the Kafka/Gemini pipeline)
  await page.getByRole('heading', { name: 'AI Translations' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Browse each language tab
  await page.locator('button').filter({ hasText: /French/i }).click();
  await page.waitForTimeout(1800);

  await page.locator('button').filter({ hasText: /Arabic/i }).click();
  await page.waitForTimeout(1800);

  await page.locator('button').filter({ hasText: /Spanish/i }).click();
  await page.waitForTimeout(2000); // hold for narration
});
