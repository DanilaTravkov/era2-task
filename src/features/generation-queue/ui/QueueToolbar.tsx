import { useEffect, useState } from "react";
import type { QueueControls, QueueSort, QueueStatusFilter } from "../model/types";

const statuses: { value: QueueStatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "queued", label: "В очереди" },
  { value: "running", label: "Идёт" },
  { value: "done", label: "Готово" },
  { value: "failed", label: "Ошибка" },
];

export function QueueToolbar({
  controls,
  onControlsChange,
}: {
  controls: QueueControls;
  onControlsChange: (controls: QueueControls) => void;
}) {
  const [search, setSearch] = useState(controls.search);

  useEffect(() => setSearch(controls.search), [controls.search]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== controls.search) onControlsChange({ ...controls, search });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [controls, onControlsChange, search]);

  return (
    <div className="queue-panel grid gap-3 rounded-lg p-3 sm:p-4 lg:grid-cols-[1fr_180px_260px]">
      <div className="queue-scrollbar flex gap-2 overflow-x-auto pb-1">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={controls.status === item.value}
            onClick={() => onControlsChange({ ...controls, status: item.value })}
            className={`queue-focus shrink-0 rounded-full border px-3 py-2 text-sm ${
              controls.status === item.value ? "border-[#e85420] bg-[#e85420] text-white shadow-[0_10px_28px_-18px_rgba(232,84,32,0.9)]" : "border-white/10 bg-white/[0.03] text-[#c8bbb2] hover:border-[#e85420]/40 hover:bg-[#e85420]/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <select
        value={controls.sort}
        onChange={(event) => onControlsChange({ ...controls, sort: event.target.value as QueueSort })}
        className="queue-focus rounded-md border border-white/10 bg-[#0e0b0a] px-3 py-2 text-sm text-[#f6efe9]"
        aria-label="Сортировка"
      >
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
      </select>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск по промпту"
        className="queue-focus rounded-md border border-white/10 bg-[#0e0b0a] px-3 py-2 text-sm text-[#f6efe9] placeholder:text-[#8a7f78]"
      />
    </div>
  );
}
