export function ProgressBar({ value }: { value: number }) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="h-full rounded-full bg-[#e85420] transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs text-[#f6f0eb]">{progress}%</span>
    </div>
  );
}
