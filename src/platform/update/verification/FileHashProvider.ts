/**
 * src/platform/update/verification/FileHashProvider.ts
 *
 * Dependency-injection seam for SHA-256 file hashing.
 *
 * The production implementation (NodeFileHashProvider) streams the file
 * through Node's crypto.createHash. The interface allows the hash
 * computation to be replaced without modifying ChecksumVerifier.
 *
 * No downloads. No installer logic. No GitHub communication.
 */

import { createHash }      from 'crypto';
import { createReadStream } from 'fs';
import { stat }            from 'fs/promises';

import { ChecksumVerificationError } from './ChecksumResult';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/**
 * Computes a hex-encoded SHA-256 digest for a file at the given path.
 *
 * @param filePath - Absolute path to the file to hash.
 * @returns        Lowercase hex-encoded SHA-256 digest.
 * @throws         ChecksumVerificationError on any I/O or computation failure.
 */
export interface IFileHashProvider {
  sha256(filePath: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// Production implementation
// ---------------------------------------------------------------------------

/**
 * Streams the file through Node's built-in crypto.createHash('sha256').
 * Memory usage is O(stream chunk size), not O(file size).
 */
export class NodeFileHashProvider implements IFileHashProvider {
  public async sha256(filePath: string): Promise<string> {
    await this.assertFileExists(filePath);

    return new Promise<string>((resolve, reject) => {
      const hash   = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
      });

      stream.on('error', (error: NodeJS.ErrnoException) => {
        reject(
          new ChecksumVerificationError(
            'file_read_error',
            `Failed to read file for hashing: "${filePath}" — ${error.message}`,
            error,
          ),
        );
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
  }

  private async assertFileExists(filePath: string): Promise<void> {
    let stats: Awaited<ReturnType<typeof stat>>;

    try {
      stats = await stat(filePath);
    } catch (error) {
      throw new ChecksumVerificationError(
        'file_not_found',
        `Installer file not found at "${filePath}"`,
        error,
      );
    }

    if (!stats.isFile()) {
      throw new ChecksumVerificationError(
        'file_not_found',
        `Path "${filePath}" exists but is not a regular file`,
      );
    }
  }
}