import { FileText, Image as ImageIcon, Mic, Video, type LucideIcon } from "lucide-react";
import type { GenerationTask, GenType } from "@/entities/generation-task";
import { formatDuration, formatEta } from "../lib/formatEta";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";

interface TaskRowProps {
  task: GenerationTask;
  queuePosition?: number;
  onCancel: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onDelete: (task: GenerationTask) => void;
}

const icons: Record<GenType, LucideIcon> = { text: FileText, image: ImageIcon, video: Video, audio: Mic };

export function TaskRow({ task, queuePosition, onCancel, onRetry, onDelete }: TaskRowProps) {
  const Icon = icons[task.type];
  const meta = [
    task.status === "done" ? formatDuration(task.durationSeconds) : formatEta(task.etaSeconds),
    `${task.credits} credits`,
    task.status === "queued" && queuePosition ? `#${queuePosition} в очереди` : undefined,
  ].filter(Boolean);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_132px_180px_132px] items-center gap-4 border-b border-white/10 px-4 py-4 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.035]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#3a2f29] bg-[#141110] text-[#e85420] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#f6f0eb]">{task.prompt}</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[#9f9188]">
            <span className="rounded-full border border-white/10 bg-[#0e0b0a]/60 px-2 py-1 font-mono text-[#d8ccc4]">{task.model}</span>
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {task.status === "failed" && task.error && <p className="mt-2 truncate text-xs text-red-200">{task.error}</p>}
        </div>
      </div>
      <StatusBadge status={task.status} />
      {task.status === "running" ? <ProgressBar value={task.progress} /> : <span className="text-sm text-[#8a7f78]">-</span>}
      <TaskActions status={task.status} onCancel={() => onCancel(task.id)} onRetry={() => onRetry(task.id)} onDelete={() => onDelete(task)} />
    </article>
  );
}
