import { InstallationStage } from "../PackageInstaller";

export interface UpdateProgressProps {
  readonly currentStage: InstallationStage;
  readonly percentage: number;
  readonly statusMessage: string;
  readonly estimatedRemainingSeconds: number | undefined;
}

function formatEstimatedRemaining(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "Calculating remaining time...";
  }

  if (seconds < 60) {
    return `${Math.max(0, Math.round(seconds))}s remaining`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}m ${remainingSeconds}s remaining`;
}

export function UpdateProgress(props: UpdateProgressProps): JSX.Element {
  const { currentStage, percentage, statusMessage, estimatedRemainingSeconds } = props;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{currentStage}</p>
        <p className="text-sm font-medium text-slate-500">{clampedPercentage}%</p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-600">{statusMessage}</p>
      <p className="mt-1 text-xs text-slate-400">
        {formatEstimatedRemaining(estimatedRemainingSeconds)}
      </p>
    </div>
  );
}
