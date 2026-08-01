/**
 * KDOS Email Verification
 *
 * Uses Resend HTTP API.
 * No SDK dependency is required.
 */

import {
  createHash,
  randomInt,
} from "node:crypto";

export interface VerificationCode {
  readonly code: string;
  readonly hash: string;
  readonly expiresAt: Date;
}

const CODE_TTL_MS =
  10 * 60 * 1000;

export function createVerificationCode(): VerificationCode {
  const code = randomInt(
    100000,
    1000000,
  ).toString();

  return {
    code,
    hash: hashVerificationCode(code),
    expiresAt: new Date(
      Date.now() + CODE_TTL_MS,
    ),
  };
}

export function hashVerificationCode(
  code: string,
): string {
  return createHash("sha256")
    .update(code.trim())
    .digest("hex");
}

export interface EmailVerificationServiceOptions {
  readonly apiKey: string;
  readonly fromEmail: string;
}

export class EmailVerificationService {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  public constructor(
    options: EmailVerificationServiceOptions,
  ) {
    this.apiKey = options.apiKey;
    this.fromEmail = options.fromEmail;
  }

  public async sendVerificationEmail(
    email: string,
    firstName: string,
    code: string,
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured.",
      );
    }

    if (!this.fromEmail) {
      throw new Error(
        "RESEND_FROM_EMAIL is not configured.",
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          from: this.fromEmail,
          to: [email],
          subject: "Your KDOS verification code",

          html: `
            <div style="font-family:Arial,sans-serif;background:#0a0a0b;color:#ffffff;padding:40px">
              <div style="max-width:560px;margin:auto;background:#151518;border:1px solid #27272a;border-radius:16px;padding:32px">
                <div style="font-size:13px;color:#60a5fa;font-weight:700;letter-spacing:.08em">
                  KDOS
                </div>

                <h1 style="font-size:28px;margin:18px 0 10px">
                  Verify your email
                </h1>

                <p style="color:#a1a1aa;line-height:1.6">
                  Hi ${escapeHtml(firstName)}, use the verification code below to activate your KDOS account.
                </p>

                <div style="margin:28px 0;padding:22px;text-align:center;background:#09090b;border:1px solid #27272a;border-radius:12px">
                  <span style="font-size:34px;letter-spacing:10px;font-weight:800">
                    ${code}
                  </span>
                </div>

                <p style="font-size:13px;color:#71717a">
                  This code expires in 10 minutes.
                </p>

                <p style="font-size:13px;color:#71717a">
                  If you did not create this account, you can ignore this email.
                </p>
              </div>
            </div>
          `,
        }),
      },
    );

    if (!response.ok) {
      const body =
        await response.text();

      throw new Error(
        `Email delivery failed (${response.status}): ${body}`,
      );
    }
  }
}

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
