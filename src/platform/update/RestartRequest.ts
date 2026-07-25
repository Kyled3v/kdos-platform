/**
 * RestartRequest
 *
 * Describes a pending KDOS restart issued after a successful update
 * installation. The request is persisted to disk before the process
 * exits so the relaunched instance can verify the restart was
 * intentional and restore the previous session.
 */

export interface RestartRequest {
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly timestamp: Date;
  readonly reason: string;
}

interface SerializedRestartRequest {
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly timestamp: string;
  readonly reason: string;
}

export function serializeRestartRequest(request: RestartRequest): string {
  const serializable: SerializedRestartRequest = {
    currentVersion: request.currentVersion,
    targetVersion: request.targetVersion,
    timestamp: request.timestamp.toISOString(),
    reason: request.reason,
  };

  return JSON.stringify(serializable, null, 2);
}

export function deserializeRestartRequest(json: string): RestartRequest {
  const parsed = JSON.parse(json) as SerializedRestartRequest;

  if (
    typeof parsed.currentVersion !== "string" ||
    typeof parsed.targetVersion !== "string" ||
    typeof parsed.timestamp !== "string" ||
    typeof parsed.reason !== "string"
  ) {
    throw new Error(
      "Restart request JSON is missing required fields or contains invalid types."
    );
  }

  const timestamp = new Date(parsed.timestamp);

  if (isNaN(timestamp.getTime())) {
    throw new Error(
      `Restart request contains an invalid timestamp: ${parsed.timestamp}`
    );
  }

  return {
    currentVersion: parsed.currentVersion,
    targetVersion: parsed.targetVersion,
    timestamp,
    reason: parsed.reason,
  };
}