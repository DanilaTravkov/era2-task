import type { TaskStatus } from "@/entities/generation-task";

const statusView: Record<TaskStatus, { label: string; className: string }> = {
  queued: { label: "В очереди", className: "border-white/10 bg-white/[0.055] text-[#c8bbb2]" },
  running: {
    label: "Идёт",
    className: "border-[#e85420]/40 bg-[#e85420]/15 text-[#ffb27a] shadow-[0_0_18px_rgba(232,84,32,0.14)]",
  },
  done: { label: "Готово", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  failed: { label: "Ошибка", className: "border-red-400/30 bg-red-400/10 text-red-200" },
  canceled: { label: "Отменено", className: "border-white/10 bg-white/[0.025] text-[#8a7f78]" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const view = statusView[status];

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${view.className}`}>
      {view.label}
    </span>
  );
}
