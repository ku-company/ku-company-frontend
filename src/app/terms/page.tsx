export const metadata = {
  title: "Terms of Service | KU-Company",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 prose prose-gray">
      <h1 className="mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        Welcome to KU-Company. By creating an account, accessing, or using our
        website and services (the "Services"), you agree to these Terms of
        Service ("Terms"). If you do not agree, do not use the Services.
      </p>

      <h2>1. Accounts and Eligibility</h2>
      <p>
        You must provide accurate information and keep your account credentials
        secure. You are responsible for activity under your account.
      </p>

      <h2>2. Acceptable Use</h2>
      <p>
        You agree not to misuse the Services, including by attempting to
        interfere with their operation, violating applicable laws, infringing
        intellectual property, or posting unlawful, misleading, or harmful
        content.
      </p>

      <h2>3. Content and Licenses</h2>
      <p>
        You retain ownership of content you submit. You grant KU-Company a
        non-exclusive, worldwide license to host, store, reproduce, and display
        your content as needed to operate the Services. You represent that you
        have the necessary rights to grant this license.
      </p>

      <h2>4. Privacy, PDPA and GDPR</h2>
      <p>
        We process personal data in accordance with the Thailand Personal Data
        Protection Act (PDPA) and, where applicable, the EU General Data
        Protection Regulation (GDPR).
      </p>
      <ul>
        <li>
          Legal bases may include consent, contract performance, legitimate
          interests, and legal obligations.
        </li>
        <li>
          Purposes include account creation, authentication, service delivery,
          communications, security, and improvement.
        </li>
        <li>
          We may share data with service providers (e.g., hosting, analytics)
          under appropriate safeguards.
        </li>
      </ul>
      <p>
        By registering, you acknowledge you have read these Terms and our
        privacy details herein and consent to the processing of your data for
        the purposes described.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        Subject to applicable law, you may have rights to access, correct,
        delete, restrict, object to processing, and data portability. To
        exercise rights, contact us via the details below.
      </p>

      <h2>6. Cookies and Tracking</h2>
      <p>
        We use cookies and similar technologies for authentication, security,
        and performance. You can manage preferences in your browser settings.
      </p>

      <h2>7. Data Retention and Security</h2>
      <p>
        We retain personal data only as long as necessary for the purposes
        outlined or as required by law. We implement technical and
        organizational measures to protect data; however, no method is 100%
        secure.
      </p>

      <h2>8. Third-Party Links</h2>
      <p>
        The Services may contain links to third-party sites. We are not
        responsible for their content or practices.
      </p>

      <h2>9. Service Changes and Availability</h2>
      <p>
        We may modify, suspend, or discontinue features at any time. We are not
        liable for outages or data loss to the extent permitted by law.
      </p>

      <h2>10. Disclaimers and Limitation of Liability</h2>
      <p>
        The Services are provided "as is" without warranties. To the fullest
        extent permitted by law, KU-Company shall not be liable for indirect or
        consequential damages.
      </p>

      <h2>11. International Transfers</h2>
      <p>
        If we transfer personal data internationally, we will use appropriate
        safeguards as required by law.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        posted on this page with an updated date. Continued use constitutes
        acceptance of the changes.
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions or to exercise your data rights, please contact the
        KU-Company support team or your organization’s administrator.
      </p>
    </main>
  );
}

