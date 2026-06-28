import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
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
      <div className="grid grid-cols-5 gap-1 sm:flex sm:gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={controls.status === item.value}
            onClick={() => onControlsChange({ ...controls, status: item.value })}
            className={`queue-focus min-w-0 whitespace-nowrap rounded-full border px-1.5 py-2 text-[11px] sm:px-3 sm:text-sm ${
              controls.status === item.value ? "border-[#e85420] bg-[#e85420] text-white shadow-[0_10px_28px_-18px_rgba(232,84,32,0.9)]" : "border-white/10 bg-white/[0.03] text-[#c8bbb2] hover:border-[#e85420]/40 hover:bg-[#e85420]/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Select
        value={controls.sort}
        onValueChange={(sort) => onControlsChange({ ...controls, sort: sort as QueueSort })}
      >
        <SelectTrigger
          aria-label="Сортировка"
          className="queue-focus h-auto border-white/10 bg-[#0e0b0a] px-3 py-2 text-sm text-[#f6efe9] shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#141110] text-[#f6efe9]">
          <SelectItem value="newest" className="focus:bg-[#e85420]/20 focus:text-white">Сначала новые</SelectItem>
          <SelectItem value="oldest" className="focus:bg-[#e85420]/20 focus:text-white">Сначала старые</SelectItem>
        </SelectContent>
      </Select>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск по промпту"
        className="queue-focus rounded-md border border-white/10 bg-[#0e0b0a] px-3 py-2 text-sm text-[#f6efe9] placeholder:text-[#8a7f78]"
      />
    </div>
  );
}
