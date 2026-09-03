export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-paper-500 text-sm">
      <span className="h-3 w-3 rounded-full bg-marigold-500 animate-pulse" />
      {label}…
    </div>
  );
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-dashed border-ink-border rounded py-10 px-6 text-center">
      <p className="text-paper-100">{title}</p>
      {hint && <p className="text-paper-500 text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-loss-600 bg-loss-600/10 rounded py-6 px-6 text-center">
      <p className="text-loss-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-marigold-400 hover:text-marigold-500 underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="border border-marigold-600 bg-marigold-600/10 rounded py-2 px-4 text-sm text-marigold-400 mb-4">
      Live updates are disconnected. Reconnecting…
    </div>
  );
}
