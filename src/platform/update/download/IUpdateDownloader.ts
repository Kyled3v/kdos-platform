/**
 * src/platform/update/download/IUpdateDownloader.ts
 *
 * Production contract for the KDOS update downloader.
 *
 * Consumed by UpdatePipeline. No caller beneath this interface
 * touches the network or the filesystem directly.
 *
 * Responsibilities declared here
 *   - Download the installer from UpdateManifest.downloadUrl
 *   - Save into a temporary update directory
 *   - Report progress via DownloadProgressListener
 *   - Support cancellation via AbortSignal
 *   - Return a structured DownloadResult on success
 *   - Throw DownloadError on failure
 *
 * Explicitly out of scope
 *   - Checksum verification (UpdateInstaller)
 *   - Installation            (UpdateInstaller)
 *   - KDOS restart            (RestartManager)
 *   - GitHub API calls        (IGitHubReleaseProvider)
 */

import type { IUpdateManifest }        from '../manifest/IUpdateManifest';
import type { DownloadProgressListener } from './DownloadProgress';
import type { DownloadResult }          from './DownloadResult';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface DownloadOptions {
  /**
   * The validated manifest describing the release to download.
   * Provides downloadUrl, installerName, and installerSize.
   */
  readonly manifest: IUpdateManifest;

  /**
   * Absolute path to the directory where the installer will be saved.
   * The directory will be created if it does not exist.
   * Example: "/var/tmp/kdos-update/" or "%TEMP%\kdos-update\"
   */
  readonly destinationDirectory: string;

  /**
   * Called on each progress sample during the download.
   * Invoked on the same thread as the download — listeners must not block.
   */
  readonly onProgress?: DownloadProgressListener;

  /**
   * Signal used to cancel the in-flight download.
   * When aborted, the downloader stops immediately and throws a DownloadError
   * with reason "cancelled". Any partial file on disk is preserved for
   * potential resumption on the next attempt.
   */
  readonly signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Network adapter — dependency injection seam
// ---------------------------------------------------------------------------

/**
 * Minimal fetch-compatible interface injected into UpdateDownloader.
 * Allows the network layer to be replaced in integration tests or
 * swapped for a custom HTTP client without modifying the downloader.
 *
 * The global fetch (Node 18+ / Electron) satisfies this interface directly.
 */
export type HttpFetch = (url: string, init: HttpFetchInit) => Promise<HttpResponse>;

export interface HttpFetchInit {
  readonly headers: Record<string, string>;
  readonly signal:  AbortSignal | undefined;
}

export interface HttpResponse {
  readonly ok:      boolean;
  readonly status:  number;
  readonly headers: HttpResponseHeaders;
  readonly body:    ReadableStream<Uint8Array> | null;
}

export interface HttpResponseHeaders {
  get(name: string): string | null;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export interface IUpdateDownloader {
  /**
   * Downloads the installer described by options.manifest to the given
   * destination directory.
   *
   * Attempts to resume a previous partial download when the destination
   * directory already contains a partial file and the server honours
   * HTTP Range requests. Falls back to a full download otherwise.
   *
   * Progress is reported via options.onProgress throughout the transfer.
   * The final snapshot (percentage === 100) is always emitted on success.
   *
   * @param options - Manifest, destination, progress listener, cancel signal.
   * @returns       A DownloadResult describing the completed download.
   * @throws        DownloadError with a structured reason on any failure.
   */
  download(options: DownloadOptions): Promise<DownloadResult>;
}