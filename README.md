# Kemlan quick loan application

A branded mobile-first QR landing page, four-part application form, and staff-only application dashboard. The form saves to Supabase. The dashboard is at `/admin.html`.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable/anon key.
4. Run `npm run dev` and open the printed local URL. Vite serves the dashboard at `/admin.html`.

## Set up Supabase

1. Create a Supabase project.
2. Open **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy the Project URL and publishable key (or legacy anon key) into `.env.local`. Never put the service role key in this frontend.
4. In **Authentication → Users**, create the manager's staff account with a strong password.
5. In SQL Editor, add that staff user's UUID to the `admin_users` allowlist. The command is provided at the bottom of `schema.sql`; use the user's actual auth email. Only allowlisted signed-in users can read the application table.
6. Deploy the static app to an HTTPS host and configure the same environment values in its build settings. Use the deployed `/` URL in the QR code and give the manager the `/admin.html` URL.

The browser's anon key is designed to be public. Row level security is what protects the records: unauthenticated visitors have insert permission only, while application reads are limited to allowlisted staff. The admin login session is held in the current browser tab's session storage and is cleared when staff sign out.

## Form scope

The application follows the supplied DOCX and omits ID number, directions/landmarks, the employment end/contract question, extension fields, HR/payroll contact fields, other-income source and amount, living expenses, and the original section 6. It asks whether applicants have additional income and loans not recorded on their payslip. Section 8 is titled “Checklist of documents to submit.” Checklist selections are stored with the application; files are not uploaded by this page.

## Notes for deployment

- Verify the Terms and Privacy Policy destinations and approved consent wording with Kemlan before publishing.
- The app intentionally collects TRN and date of birth. Limit dashboard access to staff who need it, and set organization retention and deletion procedures before production use.
- Static hosting alone does not rate-limit public submissions. Add CAPTCHA or a server-side rate limit if the QR page receives spam.
