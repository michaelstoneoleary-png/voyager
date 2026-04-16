import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = process.env.RESEND_FROM || "bon VOYAGER <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "https://bonvoyager.ai";

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
  try {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${fromName} invited you to bon VOYAGER`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;text-align:center">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#1a1a1a">bon VOYAGER</p>
          <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;font-family:sans-serif">Travel Without Limits</p>
        </td></tr>

        <!-- Hero card -->
        <tr><td style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <!-- Hero image strip -->
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 50%,#1a5276 100%);padding:40px 40px 32px;text-align:center">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.15em;color:rgba(255,255,255,0.7);text-transform:uppercase;font-family:sans-serif">You're invited</p>
            <h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;line-height:1.2">Your next adventure<br>is waiting.</h1>
          </div>

          <div style="padding:32px 40px">

            <!-- Invite message -->
            <p style="margin:0 0 ${note ? "0" : "28px"};font-size:16px;color:#444;line-height:1.6;font-family:sans-serif">
              <strong style="color:#1a1a1a">${fromName}</strong> thinks you'd love bon VOYAGER — the travel planning app that builds personalised day-by-day itineraries, suggests hidden gems, and takes care of all the logistics so you can focus on the journey.
            </p>

            ${note ? `
            <!-- Personal note -->
            <div style="margin:20px 0 28px;padding:16px 20px;background-color:#f8f7f4;border-left:3px solid #2d6a9f;border-radius:0 8px 8px 0">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.1em;color:#888;text-transform:uppercase;font-family:sans-serif">A note from ${fromName}</p>
              <p style="margin:0;font-size:15px;color:#444;line-height:1.6;font-style:italic">${note}</p>
            </div>` : ""}

            <!-- CTA button -->
            <div style="text-align:center;margin-bottom:32px">
              <a href="${url}" style="display:inline-block;background-color:#1e3a5f;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.05em;font-family:sans-serif">
                Accept your invitation →
              </a>
            </div>

            <!-- Feature highlights -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td width="33%" style="text-align:center;padding:0 8px;vertical-align:top">
                  <p style="margin:0 0 6px;font-size:22px">🗺️</p>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a1a1a;font-family:sans-serif">AI Itineraries</p>
                  <p style="margin:0;font-size:12px;color:#888;line-height:1.5;font-family:sans-serif">Day-by-day plans built around your style and budget</p>
                </td>
                <td width="33%" style="text-align:center;padding:0 8px;vertical-align:top">
                  <p style="margin:0 0 6px;font-size:22px">✈️</p>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a1a1a;font-family:sans-serif">Any trip type</p>
                  <p style="margin:0;font-size:12px;color:#888;line-height:1.5;font-family:sans-serif">Road trips, fly-and-drive, international — we've got it</p>
                </td>
                <td width="33%" style="text-align:center;padding:0 8px;vertical-align:top">
                  <p style="margin:0 0 6px;font-size:22px">💡</p>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a1a1a;font-family:sans-serif">Hidden gems</p>
                  <p style="margin:0;font-size:12px;color:#888;line-height:1.5;font-family:sans-serif">Local favourites and off-the-beaten-path discoveries</p>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="border-top:1px solid #ebebeb;margin-bottom:20px"></div>

            <!-- Footer note -->
            <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;font-family:sans-serif">
              This invitation expires in 7 days.<br>
              If you weren't expecting this email, you can safely ignore it.
            </p>

          </div>
        </td></tr>

        <!-- Email footer -->
        <tr><td style="padding-top:24px;text-align:center">
          <p style="margin:0;font-size:11px;color:#bbb;font-family:sans-serif;letter-spacing:0.05em">
            © bon VOYAGER · Travel Without Limits
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
    console.log(`[email] Invite sent to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send invite to ${to}:`, err);
  }
}

export async function sendFriendRequestEmail(to: string, fromName: string): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping friend request email");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${fromName} wants to connect on bon VOYAGER`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="padding-bottom:24px;text-align:center">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#1a1a1a">bon VOYAGER</p>
          <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;font-family:sans-serif">Travel Without Limits</p>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;padding:32px 40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a">Friend request</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#444;line-height:1.6;font-family:sans-serif">
            <strong style="color:#1a1a1a">${fromName}</strong> wants to connect with you on bon VOYAGER and share travel plans.
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${APP_URL}/journeys" style="display:inline-block;background-color:#2d6a4f;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;font-family:sans-serif">
              Open bon VOYAGER →
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#aaa;text-align:center;font-family:sans-serif">Log in and go to Invite Friends to accept or decline.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`[email] Friend request email sent to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send friend request email to ${to}:`, err);
  }
}

export async function sendFriendAcceptedEmail(to: string, fromName: string): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping friend accepted email");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${fromName} accepted your friend request`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="padding-bottom:24px;text-align:center">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#1a1a1a">bon VOYAGER</p>
          <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;font-family:sans-serif">Travel Without Limits</p>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;padding:32px 40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a">You're now connected!</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#444;line-height:1.6;font-family:sans-serif">
            <strong style="color:#1a1a1a">${fromName}</strong> accepted your friend request. You can now share journey plans with each other.
          </p>
          <div style="text-align:center">
            <a href="${APP_URL}/journeys" style="display:inline-block;background-color:#2d6a4f;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;font-family:sans-serif">
              View your journeys →
            </a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`[email] Friend accepted email sent to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send friend accepted email to ${to}:`, err);
  }
}

export async function sendJourneySharedEmail(to: string, fromName: string, journeyTitle: string): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping journey shared email");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${fromName} shared a journey with you: ${journeyTitle}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="padding-bottom:24px;text-align:center">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#1a1a1a">bon VOYAGER</p>
          <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;font-family:sans-serif">Travel Without Limits</p>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;padding:32px 40px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a">Journey shared with you</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#444;line-height:1.6;font-family:sans-serif">
            <strong style="color:#1a1a1a">${fromName}</strong> shared their journey <strong>"${journeyTitle}"</strong> with you on bon VOYAGER.
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${APP_URL}/journeys" style="display:inline-block;background-color:#2d6a4f;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;font-family:sans-serif">
              View Journey →
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#aaa;text-align:center;font-family:sans-serif">Open "Your Journeys" and go to the "Shared with Me" tab.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`[email] Journey shared email sent to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send journey shared email to ${to}:`, err);
  }
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

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Verify your bon VOYAGER account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Welcome to bon VOYAGER${firstName ? `, ${firstName}` : ""}!</h2>
          <p style="color:#555;margin-bottom:24px">Please verify your email address to complete your account setup.</p>
          <a href="${url}"
             style="background:#2563eb;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">
            Verify my email
          </a>
          <p style="color:#999;font-size:13px;margin-top:24px">
            This link expires in 24 hours. If you didn't create a bon VOYAGER account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`[email] Verification sent to ${to}`);
  } catch (err) {
    console.error(`[email] Failed to send verification to ${to}:`, err);
  }
}
