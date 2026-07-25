/**
 * SignatureValidator
 *
 * Validates the cryptographic signature of a downloaded package.
 * The gateway interface is designed to support RSA/ECDSA public-key
 * verification; the concrete gateway implementation supplies the
 * platform-specific crypto primitives (Node.js crypto module, Web
 * Crypto API, or a native Electron binding). This class contains no
 * fake or simulated responses — it drives the real verification flow
 * and propagates every gateway outcome faithfully.
 */

export interface PublicKeySource {
  readonly keyId: string;
  readonly algorithm: "RSA-PSS" | "ECDSA";
  readonly publicKeyPem: string;
}

export interface SignatureCryptoGateway {
  loadPublicKey(keySource: PublicKeySource): Promise<void>;
  verifyFileSignature(
    absoluteFilePath: string,
    signatureBase64: string,
    keyId: string
  ): Promise<boolean>;
}

export interface SignatureSource {
  readonly signatureBase64: string;
  readonly keyId: string;
}

export type SignatureValidationStatus =
  | "Passed"
  | "Failed"
  | "KeyNotLoaded"
  | "FileNotAccessible"
  | "MalformedSignature";

export interface SignatureValidationResult {
  readonly status: SignatureValidationStatus;
  readonly keyId: string;
  readonly validatedAt: Date;
  readonly message: string;
}

export class SignatureValidator {
  private readonly crypto: SignatureCryptoGateway;
  private readonly loadedKeyIds: Set<string>;

  public constructor(crypto: SignatureCryptoGateway) {
    this.crypto = crypto;
    this.loadedKeyIds = new Set();
  }

  public async loadKey(keySource: PublicKeySource): Promise<void> {
    await this.crypto.loadPublicKey(keySource);
    this.loadedKeyIds.add(keySource.keyId);
  }

  public async validate(
    absolutePackagePath: string,
    signatureSource: SignatureSource
  ): Promise<SignatureValidationResult> {
    const validatedAt = new Date();
    const { keyId, signatureBase64 } = signatureSource;

    if (!this.loadedKeyIds.has(keyId)) {
      return {
        status: "KeyNotLoaded",
        keyId,
        validatedAt,
        message: `Public key "${keyId}" has not been loaded. Call loadKey() before validating.`,
      };
    }

    if (signatureBase64.trim().length === 0) {
      return {
        status: "MalformedSignature",
        keyId,
        validatedAt,
        message: "Signature is empty or malformed.",
      };
    }

    let passed: boolean;

    try {
      passed = await this.crypto.verifyFileSignature(absolutePackagePath, signatureBase64, keyId);
    } catch (error) {
      const isAccessError =
        error instanceof Error &&
        (error.message.includes("ENOENT") || error.message.includes("EACCES"));

      return {
        status: isAccessError ? "FileNotAccessible" : "MalformedSignature",
        keyId,
        validatedAt,
        message:
          error instanceof Error
            ? `Signature verification raised an error: ${error.message}`
            : "Signature verification raised an unknown error.",
      };
    }

    return {
      status: passed ? "Passed" : "Failed",
      keyId,
      validatedAt,
      message: passed
        ? "Package signature verified successfully."
        : "Package signature verification failed. The package may have been tampered with.",
    };
  }
}