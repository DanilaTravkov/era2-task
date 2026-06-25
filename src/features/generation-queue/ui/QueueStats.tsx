import type { QueueStatsSnapshot } from "../model/types";

const items = [
  ["queued", "В очереди"],
  ["running", "Идёт"],
  ["done", "Готово"],
  ["failed", "Ошибка"],
] as const;

export function QueueStats({ stats }: { stats: QueueStatsSnapshot }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([key, label]) => (
        <article key={key} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-[#c8bbb2]">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{stats[key]}</p>
        </article>
      ))}
    </div>
  );
}
