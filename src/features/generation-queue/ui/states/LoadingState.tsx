import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#211a16] p-5">
      <div className="mb-4 flex items-center gap-3 text-sm">
        <Loader2 className="size-5 animate-spin text-[#e85420]" aria-hidden="true" />
        <span>Загружаем очередь генераций...</span>
      </div>
      <div className="space-y-3" aria-label="Скелетон загрузки очереди">
        {[0, 1, 2].map((row) => (
          <div key={row} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-3 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
