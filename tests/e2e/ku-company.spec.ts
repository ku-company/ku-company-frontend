import { test, expect, Page, request } from '@playwright/test';

// Helpers: common network mocks
const API = 'http://localhost:8000/api';

function mockRegisterAndLogin(page: Page, role: 'Student'|'Professor'|'Company', userName: string) {
  // Sign-up
  page.route(`${API}/user/sign-up`, async route => {
    const req = route.request();
    const body = req.postDataJSON?.() ?? {};
    // Simulate success
    await route.fulfill({ status: 201, body: JSON.stringify({ message: 'ok', data: { id: 1, ...body }}) });
  });

  // Login
  page.route(`${API}/user/login`, async route => {
    const data = {
      message: 'ok',
      data: {
        access_token: 'eyJ.test.token',
        refresh_token: 'ref.token',
        user_name: userName,
        roles: role.toLowerCase(),
        email: `${userName}@example.com`,
      },
    };
    await route.fulfill({ status: 200, body: JSON.stringify(data) });
  });
}

function mockAuthImageAndProfiles(page: Page, role: 'student'|'company'|'professor') {
  // Profile images endpoints (allow 404 -> default avatar) or empty.
  page.route(`${API}/employee/profile/image`, r => r.fulfill({ status: 404 }));
  page.route(`${API}/company/profile/image`, r => r.fulfill({ status: 404 }));

  // Student profile
  page.route(`${API}/employee/profile`, async r => {
    await r.fulfill({ status: 200, body: JSON.stringify({ full_name: 'Test User', user_name: 'testuser' })});
  });
  // Company profile
  page.route(`${API}/company/profile`, async r => {
    if (r.request().method() === 'POST') {
      await r.fulfill({ status: 201, body: JSON.stringify({ ok: true })});
    } else {
      await r.fulfill({ status: 200, body: JSON.stringify({ company_name: 'Test Co' })});
    }
  });
}

test.describe('UN-001 Registration', () => {
  test('Student can register and gets redirected home', async ({ page }) => {
    mockRegisterAndLogin(page, 'Student', 'student1');
    mockAuthImageAndProfiles(page, 'student');

    await page.goto('/register/student');
    await page.getByPlaceholder('Firstname').fill('John');
    await page.getByPlaceholder('Lastname').fill('Doe');
    await page.getByPlaceholder('Student ID').fill('660000001');
    await page.getByPlaceholder('Email').fill('student1@example.com');
    await page.getByPlaceholder('Username').fill('student1');
    await page.getByPlaceholder('Password', { exact: true }).fill('P@ssw0rd!');
    await page.getByPlaceholder('Confirm password').fill('P@ssw0rd!');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page).toHaveURL(/\/homepage$/);
    // Navbar has STATUS for student
    await expect(page.getByRole('link', { name: 'STATUS' })).toBeVisible();
  });

  test('Professor can register then post an announcement (PF-001)', async ({ page }) => {
    mockRegisterAndLogin(page, 'Professor', 'prof1');
    mockAuthImageAndProfiles(page, 'professor');

    // Announcements feed
    page.route(`${API}/announcements`, r => r.fulfill({ status: 200, body: JSON.stringify([]) }));
    // Create announcement
    page.route(`${API}/professor/announcements/`, async r => {
      if (r.request().method() === 'POST') {
        const payload = r.request().postDataJSON?.() ?? { content: '' };
        await r.fulfill({ status: 201, body: JSON.stringify({ id: 101, content: payload.content, created_at: new Date().toISOString(), author: { id: 1, username: 'prof1' } })});
      } else {
        await r.fulfill({ status: 200, body: JSON.stringify([]) });
      }
    });
    page.route(`${API}/professor/posts/*`, r => r.fulfill({ status: 204 }));

    await page.goto('/register/professor');
    await page.getByPlaceholder('Firstname').fill('Ada');
    await page.getByPlaceholder('Lastname').fill('Lovelace');
    await page.getByPlaceholder('Email').fill('prof1@example.com');
    await page.getByPlaceholder('Username').fill('prof1');
    await page.getByPlaceholder('Password', { exact: true }).fill('P@ssw0rd!');
    await page.getByPlaceholder('Confirm password').fill('P@ssw0rd!');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page).toHaveURL(/\/homepage$/);

    await page.goto('/professor-annoucement');
    const textarea = page.getByPlaceholder('Share an announcement…');
    await textarea.fill('Hello students, new openings are available.');
    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText('Hello students, new openings are available.')).toBeVisible();
  });

  test('Company can register and post a job immediately (exception)', async ({ page }) => {
    mockRegisterAndLogin(page, 'Company', 'acme');
    mockAuthImageAndProfiles(page, 'company');

    // Company job listings
    page.route(`${API}/company/job-postings/all`, r => r.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    // Create job
    page.route(`${API}/company/job-postings`, async r => {
      if (r.request().method() === 'POST') {
        const body = r.request().postDataJSON?.() ?? {};
        await r.fulfill({ status: 201, body: JSON.stringify({ data: { id: 999, ...body } })});
      } else {
        await r.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
      }
    });

    await page.goto('/register/company');
    await page.getByPlaceholder('Company name').fill('ACME');
    await page.getByPlaceholder('Email').fill('hr@acme.example.com');
    await page.getByPlaceholder('Username').fill('acme');
    await page.getByPlaceholder('Password', { exact: true }).fill('P@ssw0rd!');
    await page.getByPlaceholder('Confirm password').fill('P@ssw0rd!');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page).toHaveURL(/\/homepage$/);

    // Navigate to job postings and create one
    await page.goto('/company/jobpostings');
    await page.getByRole('button', { name: '+ Post a Job' }).click();
    // First <select> is Position
    await page.locator('select').first().selectOption('Backend_Developer');
    await page.getByPlaceholder('Job title').fill('Backend Developer');
    await page.getByPlaceholder('Enter job description…').fill('Build robust APIs.');
    await page.locator('input[type=number]').first().fill('2');
    // Second <select> with label Job Type
    await page.getByLabel('Job Type').selectOption({ label: 'Full Time' });
    await page.getByLabel('Location').fill('Bangkok');
    await page.getByLabel('Expected Salary (Min - Max)').getByRole('textbox').first().fill('20000');
    await page.getByLabel('Expected Salary (Min - Max)').getByRole('textbox').nth(1).fill('40000');
    await page.getByLabel('Work Place').selectOption('OnSite');
    await page.getByRole('button', { name: 'Create Job' }).click();

    await expect(page.getByText('Backend Developer')).toBeVisible();
  });
});

test.describe('ST-001 Job Application', () => {
  test('Student applies to a job with an existing resume', async ({ page }) => {
    // Login via /login
    page.route(`${API}/user/login`, async r => {
      await r.fulfill({ status: 200, body: JSON.stringify({
        message: 'ok',
        data: {
          access_token: 'eyJ.student.token',
          refresh_token: 'ref',
          user_name: 'student2',
          roles: 'student',
          email: 'student2@example.com'
        }
      })});
    });
    mockAuthImageAndProfiles(page, 'student');

    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('student2');
    await page.getByPlaceholder('Password', { exact: true }).fill('P@ssw0rd!');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/homepage$/);

    // Job filtering endpoints
    page.route(`${API}/job-postings/category`, r => r.fulfill({ status: 200, body: JSON.stringify({ data: ['All','Software'] }) }));
    page.route(`${API}/job-postings/job-type`, r => r.fulfill({ status: 200, body: JSON.stringify({ data: ['FullTime','Internship'] }) }));
    page.route(`${API}/job-postings/*`, r => r.fulfill({ status: 200, body: JSON.stringify({ job_postings: [
      { id: 123, job_title: 'Frontend Developer', description: 'React + Tailwind', jobType: 'FullTime', position: 'Frontend_Developer', available_position: 1, created_at: new Date().toISOString(), company_name: 'ACME', company_location: 'Bangkok' }
    ] }) }));

    // Resumes + apply
    page.route(`${API}/employee/profile/resumes`, r => r.fulfill({ status: 200, body: JSON.stringify({ resumes: [ { id: 77, file_url: 'https://cdn/resume_resume1.pdf', is_main: true } ] }) }));
    page.route(`${API}/employee/apply-job/*`, async r => {
      await r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/find-job');
    await page.getByRole('button', { name: 'Search' }).click();
    // Select the listed job in left panel (button with title text)
    await page.getByRole('button', { name: /Frontend Developer/ }).click();
    await page.getByRole('button', { name: 'APPLY' }).click();
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'Submit application' }).click();
    // After applying, button should reflect applied state in UI sometimes; minimum: no error, modal closed
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('ST-002 Status tracking and accepting offer', () => {
  test('Student sees application status and confirms approved offer', async ({ page }) => {
    // Login as student
    page.route(`${API}/user/login`, async r => {
      await r.fulfill({ status: 200, body: JSON.stringify({
        message: 'ok', data: { access_token: 'tok', refresh_token: 'ref', user_name: 'student3', roles: 'student', email: 's3@example.com' }
      })});
    });
    mockAuthImageAndProfiles(page, 'student');

    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('student3');
    await page.getByPlaceholder('Password', { exact: true }).fill('pw');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/homepage$/);

    // Applications list
    page.route(`${API}/employee/my-applications`, r => r.fulfill({ status: 200, body: JSON.stringify({ data: [
      { id: 1001, job_post: { position: 'Backend Developer', company: { company_name: 'ACME' }, company_id: 1 }, applied_at: new Date().toISOString(), employee_send_status: 'pending', company_send_status: 'approved' }
    ] }) }));
    // Confirm endpoint
    page.route(`${API}/employee/job-applications/*/confirm`, r => r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));

    await page.goto('/status');
    await expect(page.getByRole('heading', { name: 'Applied Company Status' })).toBeVisible();
    await expect(page.getByText('Approved')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Confirmed')).toBeVisible();
  });
});

test.describe('PF-002 Quote Job Posting', () => {
  test.fixme('Professor can quote a job posting in announcement (UI not present yet)', async ({ page }) => {
    // Marked as fixme: current UI does not surface a quote button from job posting page.
  });
});

// LIVE flow against a running backend
test.describe('LIVE-001 Student can apply (username yes1/yes1)', () => {
  test('logs in and applies to first listed job', async ({ page }) => {
    // No route mocking here: requires backend at http://localhost:8000
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('yes1');
    await page.getByPlaceholder('Password', { exact: true }).fill('yes1');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/homepage$/);

    // Go to Find Job and select first result
    await page.goto('/find-job');
    await page.getByRole('button', { name: 'Search' }).click();
    const firstCard = page.locator('aside button').first();
    await firstCard.waitFor();
    await firstCard.click();

    // Apply with default-selected resume
    await page.getByRole('button', { name: 'APPLY' }).click();
    page.once('dialog', d => d.accept()); // accept success alert
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('COMP-001 Company updates application status', () => {
  test('changes Pending to Approved in /view-resume', async ({ page }) => {
    // Mock login as company
    page.route(`${API}/user/login`, async r => {
      await r.fulfill({ status: 200, body: JSON.stringify({
        message: 'ok',
        data: {
          access_token: 'eyJ.company.token',
          refresh_token: 'ref',
          user_name: 'company1',
          roles: 'company',
          email: 'company1@example.com'
        }
      })});
    });
    mockAuthImageAndProfiles(page, 'company');

    // Provide applications list and capture status update
    page.route(`${API}/company/job-applications`, async r => {
      await r.fulfill({ status: 200, body: JSON.stringify({ data: [
        { id: 501, name: 'Student A', email: 'a@example.com', position: 'Backend_Developer', applied_at: new Date().toISOString(), resume_url: '#', company_send_status: 'Pending' }
      ] }) });
    });
    let patched: any = null;
    page.route(`${API}/company/job-applications/501/status`, async r => {
      if (r.request().method() === 'PATCH') {
        patched = r.request().postDataJSON?.() ?? {};
        await r.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
      } else {
        await r.continue();
      }
    });

    // Login
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('company1');
    await page.getByPlaceholder('Password', { exact: true }).fill('irrelevant');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/homepage$/);

    // Visit company applications view and change status
    await page.goto('/view-resume');
    const combobox = page.getByRole('combobox').first();
    await combobox.waitFor();
    await combobox.selectOption({ label: 'Approved' });

    // Assert PATCH payload
    await expect.poll(() => patched?.status).toBe('Approved');
  });
});
