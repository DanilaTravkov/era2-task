import { RefreshCw, TriangleAlert } from "lucide-react";

export function ErrorState({ message = "Не удалось загрузить очередь.", onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-[#2a1714] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <TriangleAlert className="mt-1 size-5 shrink-0 text-red-300" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Очередь не загрузилась</h2>
            <p className="mt-1 text-sm leading-6 text-[#d7c7bd]">{message}</p>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#e85420] px-4 py-2 text-sm font-semibold text-white">
          <RefreshCw className="size-4" aria-hidden="true" />
          Повторить
        </button>
      </div>
    </div>
  );
}
