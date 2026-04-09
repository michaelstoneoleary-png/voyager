import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = "Voyager <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "https://voyager-7eka.onrender.com";

export async function sendInviteEmail(
  to: string,
  fromName: string,
  token: string,
  note?: string
): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping invite email");
    return;
  }
  const url = `${APP_URL}/register?invite=${token}`;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${fromName} invited you to Voyager`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">You're invited to Voyager!</h2>
        <p style="color:#555;margin-bottom:${note ? "8px" : "24px"}">
          <strong>${fromName}</strong> has invited you to join Voyager — the travel planning app that builds personalized itineraries with AI.
        </p>
        ${note ? `<blockquote style="border-left:3px solid #2563eb;margin:0 0 24px;padding:8px 16px;color:#555;font-style:italic">${note}</blockquote>` : ""}
        <a href="${url}"
           style="background:#2563eb;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">
          Accept invitation
        </a>
        <p style="color:#999;font-size:13px;margin-top:24px">
          This invite expires in 7 days. If you weren't expecting this, you can safely ignore it.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping verification email");
    return;
  }

  const url = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your Voyager account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Welcome to Voyager${firstName ? `, ${firstName}` : ""}!</h2>
        <p style="color:#555;margin-bottom:24px">Please verify your email address to complete your account setup.</p>
        <a href="${url}"
           style="background:#2563eb;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">
          Verify my email
        </a>
        <p style="color:#999;font-size:13px;margin-top:24px">
          This link expires in 24 hours. If you didn't create a Voyager account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
