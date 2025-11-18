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
    access: 'status-access-token',
    refresh: 'status-refresh-token',
    user: 'status_student',
    email: 'status@ku.th',
    role: 'student',
    id: '77',
  });
}

test.describe('Application status tracking (ST-002)', () => {
  test('student can cancel pending jobs and confirm an approved offer', async ({ page }) => {
    await simulateStudentSession(page);

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
