# Playwright End-to-End Tests

This repo ships with Playwright tests that exercise the most critical workflows on the KU‑Company frontend (registration, job applications, announcements, and company postings). The tests live under `tests/` and rely on mocked backend responses, so they can run locally without the real API server.

## Prerequisites

1. Install dependencies if you have not already:

   ```bash
   npm install
   ```

2. Start the Next.js app in another terminal so Playwright can drive it:

   ```bash
   npm run dev
   ```

   The browser automation targets `http://localhost:3000` by default. Override it with `PLAYWRIGHT_BASE_URL` if your dev server runs elsewhere.  
   The mocked API endpoints default to `http://localhost:8000`; you can override that with `PLAYWRIGHT_API_BASE`.

3. (Optional) Install Playwright browsers once:

   ```bash
   npx playwright install
   ```

## Running the suite

Run all projects (Chromium, Firefox, WebKit) in headless mode:

```bash
npx playwright test
```

To run a single file or debug interactively:

```bash
npx playwright test tests/student-job-flow.spec.ts --headed --project=chromium
```

## Covered scenarios

| Test File / Case | Use Case(s) | What it verifies |
| --- | --- | --- |
| `student-registration.spec.ts` – student happy path | UN-001 | Numeric-only Student ID entry, PDPA consent, and seamless login after signup (with mocked `/sign-up` and `/login`). |
| `student-registration.spec.ts` – Google modal guard | UN-001 | The OAuth consent modal refuses to continue without consent and strips non-digits from the Student ID prompt. |
| `student-job-flow.spec.ts` – apply with resume | ST-001 | Students can search/filter jobs, view job details, and submit an application with an existing résumé; the apply screen POSTs the chosen `resume_id`. |
| `student-job-flow.spec.ts` – apply screen without resume | ST-001 (exception) | The `/apply/:id` page blocks submission when no résumé exists and prompts the student to upload one. |
| `student-status.spec.ts` – confirm & cancel | ST-002 | The status dashboard lists applications, lets students cancel pending ones, auto-cancels the remaining offers before confirming, and updates the UI after confirmations. |
| `professor-announcements.spec.ts` – manual post | PF-001 | Professors can compose announcements, mark connections, and see the new post injected into the feed. |
| `professor-announcements.spec.ts` – quote from job board | PF-002 | Verified professors can use the “Repost” action on the job board, add notes, flag connections, and hit the repost endpoint successfully. |
| `company-job-posting.spec.ts` – create job | CP-001 | Companies can fill every field in the posting form (including salary ranges) and see the job appear in their dashboard after the POST completes. |
| `company-job-posting.spec.ts` – salary validation | CP-001 (validation) | Salary inputs only accept numeric values and enforce “min < max”, disabling submission and showing inline guidance. |

Add additional specs for upcoming features by following the same pattern: mock backend calls with `page.route`, seed `localStorage` for the desired role, and assert the visible UI behaviour.***
