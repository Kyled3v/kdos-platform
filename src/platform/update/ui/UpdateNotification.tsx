
export interface UpdateNotificationProps {
  readonly latestVersion: string;
  readonly onInstallNow: () => void;
  readonly onRemindLater: () => void;
  readonly onDismiss: () => void;
}

export function UpdateNotification(props: UpdateNotificationProps): JSX.Element {
  const { latestVersion, onInstallNow, onRemindLater, onDismiss } = props;

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 w-96 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Update available</p>
          <p className="mt-1 text-sm text-slate-600">
            KDOS {latestVersion} is ready to install.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss update notification"
          className="ml-4 shrink-0 text-lg leading-none text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onInstallNow}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Install Now
        </button>
        <button
          type="button"
          onClick={onRemindLater}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Remind Me Later
        </button>
      </div>
    </div>
  );
}
