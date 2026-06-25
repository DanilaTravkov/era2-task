import type { TaskStatus } from "@/entities/generation-task";

const statusView: Record<TaskStatus, { label: string; className: string }> = {
  queued: { label: "В очереди", className: "border-white/10 bg-white/[0.06] text-[#c8bbb2]" },
  running: { label: "Идёт", className: "border-[#e85420]/35 bg-[#e85420]/15 text-[#ffb08f]" },
  done: { label: "Готово", className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  failed: { label: "Ошибка", className: "border-red-400/25 bg-red-400/10 text-red-200" },
  canceled: { label: "Отменено", className: "border-white/10 bg-white/[0.03] text-[#8f8178]" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const view = statusView[status];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${view.className}`}>
      {view.label}
    </span>
  );
}
