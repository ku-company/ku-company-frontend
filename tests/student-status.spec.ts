import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:8000';
const STUDENT_USERNAME = process.env.PLAYWRIGHT_STUDENT_USER ?? 'janedoe';
const STUDENT_PASSWORD = process.env.PLAYWRIGHT_STUDENT_PASS ?? 'password123';

async function loginAsStudent(page: Page) {
  await page.route(`${API_BASE}/api/user/login`, async (route) => {
    const payload = JSON.parse(route.request().postData() || '{}');
    if (payload?.user_name !== STUDENT_USERNAME || payload?.password !== STUDENT_PASSWORD) {
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
          access_token: 'status-access-token',
          refresh_token: 'status-refresh-token',
          user_name: STUDENT_USERNAME,
          roles: 'Student',
          email: `${STUDENT_USERNAME}@ku.th`,
          id: 77,
        },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 77,
        user_name: STUDENT_USERNAME,
        role: 'Student',
        email: `${STUDENT_USERNAME}@ku.th`,
      }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Username').fill(STUDENT_USERNAME);
  await page.getByPlaceholder('Password').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/(homepage)?$/);
}

test.describe('Application status tracking (ST-002)', () => {
  test.skip('student can cancel pending jobs and confirm an approved offer', async ({ page }) => {
    await loginAsStudent(page);

    const cancelCalls: number[] = [];
    let confirmCalledFor: number | null = null;

    const applications = [
      {
        id: 1,
        applied_at: '2025-01-01T00:00:00.000Z',
        employee_send_status: 'pending',
        company_send_status: 'approved',
        job_post: {
          id: 1,
          position: 'Backend Developer',
          company: { company_name: 'Acme Labs', user_id: 701 },
        },
      },
      {
        id: 2,
        applied_at: '2025-01-05T00:00:00.000Z',
        employee_send_status: 'pending',
        company_send_status: 'pending',
        job_post: {
          id: 2,
          position: 'QA Engineer',
          company: { company_name: 'Zenith Soft', user_id: 702 },
        },
      },
      {
        id: 3,
        applied_at: '2025-01-06T00:00:00.000Z',
        employee_send_status: 'pending',
        company_send_status: 'pending',
        job_post: {
          id: 3,
          position: 'UI Designer',
          company: { company_name: 'Bright Studio', user_id: 703 },
        },
      },
    ];

    await page.route(`${API_BASE}/api/employee/my-applications`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: applications }),
      });
    });

    await page.route('**/api/employee/cancel-application/**', async (route) => {
      const match = route.request().url().match(/cancel-application\/(\d+)/);
      if (match) cancelCalls.push(Number(match[1]));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.route('**/api/employee/job-applications/**/confirm', async (route) => {
      const match = route.request().url().match(/job-applications\/(\d+)\/confirm/);
      if (match) confirmCalledFor = Number(match[1]);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/status');

    await expect(page.getByRole('row', { name: /Backend Developer/i })).toBeVisible();
    await expect(page.getByRole('row', { name: /QA Engineer/i })).toBeVisible();
    await expect(page.getByRole('row', { name: /UI Designer/i })).toBeVisible();

    const uiRow = page.getByRole('row', { name: /UI Designer/i });
    await uiRow.getByRole('button', { name: 'Cancel' }).click();
    await expect.poll(() => cancelCalls.includes(3)).toBeTruthy();
    await expect(uiRow).not.toBeVisible();

    await page.getByRole('row', { name: /Backend Developer/i }).getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => cancelCalls.includes(2)).toBeTruthy();
    await expect.poll(() => confirmCalledFor).toBe(1);

    const confirmedRow = page.getByRole('row', { name: /Backend Developer/i });
    await expect(confirmedRow.getByText('Confirmed')).toBeVisible();
    await expect(confirmedRow.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });
});
