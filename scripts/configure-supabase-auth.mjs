/**
 * Applies the Builder's Cell auth settings to a Supabase project: 6-digit OTP codes,
 * themed sign-in emails, SMTP, and the Google provider. Idempotent - re-run any time.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_...      # required, personal access token
 *   SMTP_HOST=smtp-relay.brevo.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... \
 *   SMTP_SENDER=you@example.com SMTP_SENDER_NAME="Builder's Cell" \
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
 *   SITE_URL=http://localhost:3000 \
 *   node scripts/configure-supabase-auth.mjs
 *
 * Custom SMTP is not optional: Supabase's built-in sender cannot deliver a code
 * (its free-tier templates are link-only and cannot be edited) and is capped at 2/hour.
 */
const REF = process.env.SUPABASE_PROJECT_REF ?? "yyajrwdgkyviuiavfbpk";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN is required");

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

const codeEmail = (heading, lead) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;margin:0;padding:32px 0;font-family:'Inter Tight',Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid rgba(10,12,14,0.09);border-radius:20px;">
      <tr><td style="padding:36px 36px 8px 36px;">
        <div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#0b0d0e;">Builder<span style="color:#00b86b;">'</span>sCell</div>
      </td></tr>
      <tr><td style="padding:16px 36px 0 36px;">
        <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#0b0d0e;">${heading}</h1>
        <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#5a6269;">${lead}</p>
      </td></tr>
      <tr><td style="padding:24px 36px 0 36px;">
        <div style="background:#f5f5f2;border:1px solid rgba(10,12,14,0.09);border-radius:14px;padding:20px;text-align:center;">
          <div style="font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace;font-size:34px;font-weight:600;letter-spacing:0.22em;color:#0b0d0e;">{{ .Token }}</div>
        </div>
        <p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#5a6269;">This code expires in 10 minutes and can only be used once.</p>
      </td></tr>
      <tr><td style="padding:24px 36px 36px 36px;">
        <hr style="border:none;border-top:1px solid rgba(10,12,14,0.09);margin:0 0 16px 0;" />
        <p style="margin:0;font-size:12px;line-height:1.6;color:#5a6269;">If you didn't ask for this, you can ignore this email &mdash; nobody can get in without the code.</p>
        <p style="margin:10px 0 0 0;font-size:12px;color:#5a6269;">Builder's Cell &middot; Bangladesh's robotics revolution starts in one room.</p>
      </td></tr>
    </table>
  </td></tr>
</table>`.trim();

const payload = {
  site_url: SITE_URL,
  uri_allow_list: `${SITE_URL}/**,https://builderscell.vercel.app/**`,
  mailer_otp_length: 6,
  mailer_otp_exp: 600,
  mailer_autoconfirm: false,
};

if (process.env.SMTP_HOST) {
  Object.assign(payload, {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: String(process.env.SMTP_PORT ?? 587), // the API rejects a number here
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    smtp_admin_email: process.env.SMTP_SENDER,
    smtp_sender_name: process.env.SMTP_SENDER_NAME ?? "Builder's Cell",
    smtp_max_frequency: 20,
    rate_limit_email_sent: Number(process.env.EMAIL_RATE_LIMIT ?? 30),
    // Template editing is rejected while the project still uses the built-in sender.
    mailer_subjects_confirmation: "{{ .Token }} is your Builder's Cell code",
    mailer_subjects_magic_link: "{{ .Token }} is your Builder's Cell code",
    mailer_templates_confirmation_content: codeEmail(
      "Confirm your email",
      "Welcome to Builder's Cell. Enter this code on the sign-up screen to confirm your email address.",
    ),
    mailer_templates_magic_link_content: codeEmail(
      "Your sign-in code",
      "Enter this code on the Builder's Cell sign-in screen to continue.",
    ),
  });
}

if (process.env.GOOGLE_CLIENT_ID) {
  Object.assign(payload, {
    external_google_enabled: true,
    external_google_client_id: process.env.GOOGLE_CLIENT_ID,
    external_google_secret: process.env.GOOGLE_CLIENT_SECRET,
  });
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const c = await res.json();

console.log("Applied:", {
  site_url: c.site_url,
  otp: `${c.mailer_otp_length} digits / ${c.mailer_otp_exp}s`,
  smtp: c.smtp_host ? `${c.smtp_host}:${c.smtp_port} as ${c.smtp_admin_email}` : "built-in (cannot send codes)",
  emails_per_hour: c.rate_limit_email_sent,
  code_in_template: c.mailer_templates_magic_link_content.includes("{{ .Token }}"),
  google: c.external_google_enabled,
});
