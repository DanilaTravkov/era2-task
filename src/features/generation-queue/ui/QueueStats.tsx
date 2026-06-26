import type { QueueStatsSnapshot } from "../model/types";

const items = [
  ["queued", "В очереди", "bg-white/35"],
  ["running", "Идёт", "bg-[#e85420]"],
  ["done", "Готово", "bg-emerald-400"],
  ["failed", "Ошибка", "bg-red-400"],
] as const;

export function QueueStats({ stats }: { stats: QueueStatsSnapshot }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([key, label, color]) => (
        <article key={key} className="queue-panel rounded-lg p-4 transition-colors duration-200 hover:border-[#e85420]/25">
          <span className={`mb-3 block h-1 w-8 rounded-full ${color}`} />
          <p className="text-sm text-[#c8bbb2]">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-[#f6efe9]">{stats[key]}</p>
        </article>
      ))}
    </div>
  );
}
