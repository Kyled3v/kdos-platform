import { Resend } from "resend";

export interface VerificationEmail {
  readonly email: string;
  readonly firstName: string;
  readonly code: string;
}

export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  public constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured.",
      );
    }

    this.resend = new Resend(apiKey);
    this.from =
      process.env.KDOS_EMAIL_FROM ??
      "KDOS <onboarding@resend.dev>";
  }

  public async sendVerificationEmail(
    data: VerificationEmail,
  ): Promise<void> {
    const result = await this.resend.emails.send({
      from: this.from,
      to: data.email,
      subject: "Verify your KDOS account",
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a0a0b;color:#fff;padding:40px">
          <div style="max-width:520px;margin:auto">
            <h1>KDOS</h1>

            <p>Hello ${escapeHtml(data.firstName)},</p>

            <p>
              Use the verification code below to verify your KDOS account.
            </p>

            <div style="
              margin:30px 0;
              padding:20px;
              background:#18181b;
              border:1px solid #27272a;
              border-radius:12px;
              text-align:center;
            ">
              <div style="
                font-size:32px;
                font-weight:bold;
                letter-spacing:8px;
              ">
                ${data.code}
              </div>
            </div>

            <p style="color:#a1a1aa">
              This code expires in 15 minutes.
            </p>

            <p style="color:#71717a">
              If you did not create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(
        `Verification email failed: ${result.error.message}`,
      );
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
