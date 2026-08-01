import {
  createVerificationCode,
  isVerificationExpired,
  type EmailVerificationRecord,
} from "./EmailVerification.js";

export class EmailVerificationService {
  private readonly records = new Map<
    string,
    EmailVerificationRecord
  >();

  public create(email: string): string {
    const normalisedEmail = email.toLowerCase().trim();

    const code = createVerificationCode();

    const record: EmailVerificationRecord = {
      email: normalisedEmail,
      code,
      expiresAt: new Date(
        Date.now() + 15 * 60 * 1000,
      ),
      verified: false,
    };

    this.records.set(normalisedEmail, record);

    console.log(
      `[KDOS] Verification code generated for ${normalisedEmail}: ${code}`,
    );

    return code;
  }

  public verify(
    email: string,
    code: string,
  ): boolean {
    const normalisedEmail = email.toLowerCase().trim();

    const record = this.records.get(normalisedEmail);

    if (!record) {
      return false;
    }

    if (record.verified) {
      return true;
    }

    if (isVerificationExpired(record)) {
      this.records.delete(normalisedEmail);
      return false;
    }

    if (record.code !== code.trim()) {
      return false;
    }

    this.records.set(normalisedEmail, {
      ...record,
      verified: true,
    });

    return true;
  }

  public resend(email: string): string {
    return this.create(email);
  }

  public isVerified(email: string): boolean {
    const record = this.records.get(
      email.toLowerCase().trim(),
    );

    return record?.verified === true;
  }
}
