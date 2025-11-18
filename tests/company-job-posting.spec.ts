import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:8000';

async function simulateCompanySession(page: Page) {
  await page.addInitScript((payload) => {
    localStorage.setItem('access_token', payload.access);
    localStorage.setItem('refresh_token', payload.refresh);
    localStorage.setItem('user_name', payload.user);
    localStorage.setItem('email', payload.email);
    localStorage.setItem('role', payload.role);
    localStorage.setItem('user_id', payload.id);
  }, {
    access: 'company-access',
    refresh: 'company-refresh',
    user: 'acme_hr',
    email: 'hr@acme.com',
    role: 'company',
    id: '300',
  });
}

test.describe('Company job posting (CP-001)', () => {
  test('company can create a new job posting', async ({ page }) => {
    await simulateCompanySession(page);

    await page.route(`${API_BASE}/api/company/job-postings/all`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    let createdJob: any = null;
    await page.route(`${API_BASE}/api/company/job-postings`, async (route) => {
      if (route.request().method() === 'POST') {
        createdJob = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 901,
              ...createdJob,
            },
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/company/jobpostings');

    await page.getByPlaceholder('Position (e.g., Backend Developer)').fill('Graduate Software Engineer');
    await page.getByPlaceholder('Job Title').fill('Graduate Software Engineer');
    await page.getByPlaceholder('Enter Job Description...').fill('Work with mentors and learn about clean architecture.');

    const positionsInput = page.locator('label:has-text("Positions Available")').locator('..').locator('input');
    await positionsInput.fill('5');

    const jobTypeSelect = page.locator('label:has-text("Job Type")').locator('..').locator('select');
    await jobTypeSelect.selectOption({ label: 'Full Time' });
    await page.getByPlaceholder('City / Remote').fill('Bangkok');
    await page.getByPlaceholder('18000').fill('20000');
    await page.getByPlaceholder('30000').fill('35000');
    const workplaceSelect = page.locator('label:has-text("Workplace")').locator('..').locator('select');
    await workplaceSelect.selectOption('Hybrid');
    await page.locator('label:has-text("Expiration Date")').locator('..').locator('input').fill('2025-12-01');

    await page.getByRole('button', { name: 'Create Job' }).click();

    await expect.poll(() => createdJob?.job_title).toBe('Graduate Software Engineer');
    expect(createdJob?.minimum_expected_salary).toBe(20000);
    expect(createdJob?.maximum_expected_salary).toBe(35000);

    await expect(page.getByText('Graduate Software Engineer')).toBeVisible();
  });

  test('salary validation prevents invalid ranges', async ({ page }) => {
    await simulateCompanySession(page);

    await page.route(`${API_BASE}/api/company/job-postings/all`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/company/jobpostings');

    await page.getByPlaceholder('Position (e.g., Backend Developer)').fill('Data Analyst');
    await page.getByPlaceholder('Job Title').fill('Data Analyst');
    await page.getByPlaceholder('Enter Job Description...').fill('Help the team analyse dashboards.');
    const positionsInput = page.locator('label:has-text("Positions Available")').locator('..').locator('input');
    await positionsInput.fill('1');
    const jobTypeSelect = page.locator('label:has-text("Job Type")').locator('..').locator('select');
    await jobTypeSelect.selectOption({ label: 'Full Time' });
    await page.getByPlaceholder('City / Remote').fill('Bangkok');
    await page.getByPlaceholder('18000').fill('5000');
    await page.getByPlaceholder('30000').fill('4000');

    const validationMsg = page.getByText('Minimum salary must be lower than maximum salary.');
    await expect(validationMsg).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Job' })).toBeDisabled();
  });
});
