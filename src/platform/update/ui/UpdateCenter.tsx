
export interface UpdateCenterProps {
  readonly currentVersion: string;
  readonly latestVersion: string | undefined;
  readonly releaseNotes: string | undefined;
  readonly updateAvailable: boolean;
  readonly isChecking: boolean;
  readonly onInstall: () => void;
  readonly onCheckAgain: () => void;
}

export function UpdateCenter(props: UpdateCenterProps): JSX.Element {
  const {
    currentVersion,
    latestVersion,
    releaseNotes,
    updateAvailable,
    isChecking,
    onInstall,
    onCheckAgain,
  } = props;

  return (
    <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-900">Update Center</h2>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Current Version
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">{currentVersion}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Latest Version
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {latestVersion ?? "Unknown"}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Release Notes
        </h3>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
          {releaseNotes ?? "No release notes are available for this version."}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onInstall}
          disabled={!updateAvailable}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Install
        </button>
        <button
          type="button"
          onClick={onCheckAgain}
          disabled={isChecking}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isChecking ? "Checking..." : "Check Again"}
        </button>
      </div>
    </div>
  );
}
