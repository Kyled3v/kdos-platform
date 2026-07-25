/**
 * ChecksumValidator
 *
 * Computes the SHA-256 hash of a downloaded package and compares it
 * against the hash declared in the manifest. All cryptographic
 * operations are delegated to an injected gateway so this class
 * remains free of Node.js and Electron APIs.
 */

export interface ChecksumCryptoGateway {
  sha256File(absoluteFilePath: string): Promise<string>;
}

export type ChecksumValidationStatus = "Passed" | "Failed" | "FileNotAccessible";

export interface ChecksumValidationResult {
  readonly status: ChecksumValidationStatus;
  readonly expectedHash: string;
  readonly actualHash: string | undefined;
  readonly validatedAt: Date;
  readonly message: string;
}

export class ChecksumValidator {
  private readonly crypto: ChecksumCryptoGateway;

  public constructor(crypto: ChecksumCryptoGateway) {
    this.crypto = crypto;
  }

  public async validate(
    absolutePackagePath: string,
    expectedSha256: string
  ): Promise<ChecksumValidationResult> {
    const validatedAt = new Date();
    let actualHash: string;

    try {
      actualHash = await this.crypto.sha256File(absolutePackagePath);
    } catch (error) {
      return {
        status: "FileNotAccessible",
        expectedHash: expectedSha256,
        actualHash: undefined,
        validatedAt,
        message:
          error instanceof Error
            ? `Package file could not be read: ${error.message}`
            : "Package file could not be read.",
      };
    }

    const normalizedExpected = expectedSha256.toLowerCase().trim();
    const normalizedActual = actualHash.toLowerCase().trim();
    const passed = normalizedActual === normalizedExpected;

    return {
      status: passed ? "Passed" : "Failed",
      expectedHash: normalizedExpected,
      actualHash: normalizedActual,
      validatedAt,
      message: passed
        ? "SHA-256 checksum matched."
        : "SHA-256 checksum did not match. The package may be corrupted or tampered with.",
    };
  }
}