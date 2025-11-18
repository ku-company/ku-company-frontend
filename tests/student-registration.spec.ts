import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8000';

test.describe('Student registration', () => {
  test('submits numeric student ID and completes happy path with mocked APIs', async ({ page }) => {
    let postedPayload: any = null;
    let loginCalled = false;

    await page.route(`${API_BASE}/api/user/sign-up`, async (route) => {
      postedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    });

    await page.route(`${API_BASE}/api/user/login`, async (route) => {
      loginCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Login success',
          data: {
            access_token: 'test-access',
            refresh_token: 'test-refresh',
            user_name: 'student123',
            roles: 'Student',
            email: 'student@ku.th',
          },
        }),
      });
    });

    await page.goto('/register/student');

    await page.fill('input[name="first_name"]', 'Jane');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="stdId"]', '6610545001');
    await page.fill('input[name="email"]', 'jane@ku.th');
    await page.fill('input[name="user_name"]', 'janedoe');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirm_password"]', 'password123');
    await page.getByRole('checkbox', { name: /Terms of Service/i }).check();

    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect.poll(() => loginCalled).toBeTruthy();
    expect(postedPayload?.stdId).toBe('6610545001');
    expect(postedPayload?.pdpa_consent).toBe(true);
    await expect(page).toHaveURL(/\/(homepage)?$/);
  });

  test('Google consent modal enforces consent and numeric student ID', async ({ page }) => {
    await page.goto('/register/student');

    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page.getByRole('heading', { name: 'Continue with Google' })).toBeVisible();

    const studentIdInput = page.getByLabel('Student ID');
    await studentIdInput.fill('abc123');
    await expect(studentIdInput).toHaveValue('123');

    await page.getByRole('button', { name: 'Agree & Continue' }).click();
    await expect(page.getByText('Please agree to the Terms before continuing.')).toBeVisible();

    await page.getByRole('checkbox', { name: /I consent/i }).check();
    await page.getByRole('button', { name: 'Agree & Continue' }).click();
    await expect(page.getByText('Student ID is required for the Google signup flow.')).toBeVisible();
  });
});
