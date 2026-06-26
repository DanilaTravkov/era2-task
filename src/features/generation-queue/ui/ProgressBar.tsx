export function ProgressBar({ value }: { value: number }) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-[#0e0b0a] ring-1 ring-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="queue-progress-fill h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs text-[#f6efe9]">{progress}%</span>
    </div>
  );
}
