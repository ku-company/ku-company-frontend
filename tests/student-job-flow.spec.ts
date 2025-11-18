import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:8000';

async function simulateStudentSession(page: Page) {
  await page.addInitScript((payload) => {
    localStorage.setItem('access_token', payload.access);
    localStorage.setItem('refresh_token', payload.refresh);
    localStorage.setItem('user_name', payload.user);
    localStorage.setItem('email', payload.email);
    localStorage.setItem('role', payload.role);
    localStorage.setItem('user_id', payload.id);
  }, {
    access: 'e2e-student-access',
    refresh: 'e2e-student-refresh',
    user: 'student_test',
    email: 'student@ku.th',
    role: 'student',
    id: '42',
  });
}

const jobFixture = {
  id: 101,
  job_title: 'Backend Developer',
  description: 'Join our API team and build GraphQL endpoints.',
  jobType: 'FullTime',
  position: 'Backend Developer',
  available_position: 2,
  company_id: 73,
  company_name: 'Acme Labs',
  company_location: 'Bangkok, Thailand',
  location: 'Bangkok',
  company_profile_image: null,
  work_place: 'Hybrid',
  minimum_expected_salary: 25000,
  maximum_expected_salary: 40000,
  company_user_id: 9001,
};

function mockStudentJobApis(page: Page, options: { resumes: any[]; appliedJobIds?: number[]; captureApply?: (body: any) => void }) {
  const { resumes, appliedJobIds = [], captureApply } = options;

  page.route('**/api/job-postings/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/job-type')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: ['All', 'Full Time', 'Part Time'] }),
      });
      return;
    }

    const detailMatch = url.pathname.match(/\/api\/job-postings\/(\d+)/);
    if (detailMatch) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_posting: jobFixture }),
      });
      return;
    }

    if (url.pathname.endsWith('/api/job-postings') || url.pathname.endsWith('/api/job-postings/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [jobFixture] }),
      });
      return;
    }

    await route.fallback();
  });

  page.route(`${API_BASE}/api/employee/profile/resumes`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ resumes }),
    });
  });

  page.route(`${API_BASE}/api/employee/my-applications`, async (route) => {
    const payload = appliedJobIds.map((id) => ({
      id,
      job_post: { id },
      job_post_id: id,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: payload }),
    });
  });

  page.route(`${API_BASE}/api/employee/apply-job/${jobFixture.id}`, async (route) => {
    if (captureApply) {
      try {
        captureApply(JSON.parse(route.request().postData() || '{}'));
      } catch {
        captureApply({});
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

test.describe('Student job application flow (ST-001)', () => {
  test('student can filter, view, and apply to a job with an existing resume', async ({ page }) => {
    await simulateStudentSession(page);
    let appliedPayload: any = null;

    mockStudentJobApis(page, {
      resumes: [
        { id: 1, file_url: 'https://files/resume.pdf', name: 'resume.pdf' },
      ],
      appliedJobIds: [],
      captureApply: (body) => {
        appliedPayload = body;
      },
    });

    page.on('dialog', (dialog) => {
      dialog.dismiss().catch(() => {});
    });

    await page.goto('/find-job');

    await expect(page.getByRole('button', { name: /Backend Developer/i })).toBeVisible();

    await page.getByPlaceholder('Keyword').fill('backend');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.getByRole('button', { name: /Backend Developer/i }).click();
    await expect(page.getByRole('heading', { name: 'Backend Developer' })).toBeVisible();
    await expect(page.getByText('Acme Labs')).toBeVisible();

    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/\/apply\/101$/);
    await expect(page.getByText('Resumé File', { exact: false })).toBeVisible();
    await expect(page.getByText('resume.pdf')).toBeVisible();

    await page.getByRole('button', { name: /^Apply$/ }).click();

    await expect.poll(() => appliedPayload).not.toBeNull();
    expect(appliedPayload?.resume_id).toBe(1);
  });

  test('apply screen blocks submission when no resume exists', async ({ page }) => {
    await simulateStudentSession(page);

    mockStudentJobApis(page, {
      resumes: [],
      appliedJobIds: [],
    });

    await page.goto(`/apply/${jobFixture.id}`);

    await expect(page.getByText('No résumé found.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Apply$/ })).toBeDisabled();
  });
});
