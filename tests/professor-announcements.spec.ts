import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:8000';
const PROFESSOR_USERNAME = process.env.PLAYWRIGHT_PROF_USER ?? 'professor_zero';
const PROFESSOR_PASSWORD = process.env.PLAYWRIGHT_PROF_PASS ?? 'password123';

async function loginAsProfessor(page: Page) {
  await page.route(`${API_BASE}/api/user/login`, async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body?.user_name !== PROFESSOR_USERNAME || body?.password !== PROFESSOR_PASSWORD) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login success',
        data: {
          access_token: 'prof-access',
          refresh_token: 'prof-refresh',
          user_name: PROFESSOR_USERNAME,
          roles: 'Professor',
          email: `${PROFESSOR_USERNAME}@ku.th`,
          id: 501,
        },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 501,
        user_name: PROFESSOR_USERNAME,
        role: 'Professor',
        verified: true,
        email: `${PROFESSOR_USERNAME}@ku.th`,
      }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Username').fill(PROFESSOR_USERNAME);
  await page.getByPlaceholder('Password').fill(PROFESSOR_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/(homepage)?$/);
}

const professorJobFixture = {
  id: 555,
  job_title: 'AI Research Mentor',
  description: 'Help guide AI research projects.',
  jobType: 'Contract',
  position: 'AI Research Mentor',
  available_position: 1,
  company_id: 321,
  company_name: 'Neural Nexus',
  company_location: 'Bangkok, Thailand',
  location: 'Bangkok',
  company_profile_image: null,
  work_place: 'Remote',
  minimum_expected_salary: 45000,
  maximum_expected_salary: 60000,
  company_user_id: 9876,
};

test.describe('Professor announcements (PF-001 & PF-002)', () => {
  test('professor can publish a standalone announcement', async ({ page }) => {
    await loginAsProfessor(page);

    await page.route(`${API_BASE}/api/announcements`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    let createdPayload: any = null;
    await page.route(`${API_BASE}/api/professor/announcements/`, async (route) => {
      createdPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 900,
          content: createdPayload?.content ?? '',
          created_at: new Date().toISOString(),
          author: { userId: 501, username: 'professor_zero' },
        }),
      });
    });

    await page.goto('/professor-annoucement');

    const textarea = page.getByPlaceholder('Share an announcement…');
    await textarea.fill('Career fair this Friday!');
    await page.getByLabel('I have a connection with this announcement').check();
    await page.getByRole('button', { name: /^Post$/ }).click();

    await expect.poll(() => createdPayload?.content).toBe('Career fair this Friday!');
    await expect(createdPayload?.is_connection).toBe(true);
    await expect(page.getByText('Career fair this Friday!')).toBeVisible();
  });

  test('professor can quote a job directly from the job board', async ({ page }) => {
    await loginAsProfessor(page);

    await page.route(`${API_BASE}/api/announcements`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/job-postings/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/job-type')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: ['All', 'Contract'] }),
        });
        return;
      }
      const detailMatch = url.pathname.match(/\/api\/job-postings\/(\d+)/);
      if (detailMatch) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ job_posting: professorJobFixture }),
        });
        return;
      }
      if (url.pathname.endsWith('/api/job-postings') || url.pathname.endsWith('/api/job-postings/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [professorJobFixture] }),
        });
        return;
      }
      await route.fallback();
    });

    await page.route('**/api/user/company-profile/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: professorJobFixture.company_id, company_name: professorJobFixture.company_name } }),
      });
    });

    let repostPayload: any = null;
    await page.route(`${API_BASE}/api/professor/job-postings/repost/${professorJobFixture.id}`, async (route) => {
      repostPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/find-job');
    await page.getByRole('button', { name: /AI Research Mentor/i }).click();
    await page.getByRole('button', { name: /Repost$/ }).click();

    const note = 'Great fit for AI enthusiasts!';
    await page.getByRole('textbox').last().fill(note);
    await page.getByLabel('I have a connection with this job post').check();
    await page.getByRole('button', { name: /^Repost$/ }).click();

    await expect.poll(() => repostPayload?.content).toBe(note);
    expect(repostPayload?.is_connection).toBe(true);
    await expect(page.getByText('Reposted job successfully.')).toBeVisible();
  });
});
