import { FileText, Image as ImageIcon, Mic, Video, type LucideIcon } from "lucide-react";
import type { GenerationTask, GenType } from "@/entities/generation-task";
import { formatDuration, formatEta } from "../lib/formatEta";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";

interface TaskCardProps {
  task: GenerationTask;
  queuePosition?: number;
  onCancel: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const icons: Record<GenType, LucideIcon> = { text: FileText, image: ImageIcon, video: Video, audio: Mic };

export function TaskCard({ task, queuePosition, onCancel, onRetry, onDelete }: TaskCardProps) {
  const Icon = icons[task.type];
  const meta = [
    task.status === "done" ? formatDuration(task.durationSeconds) : formatEta(task.etaSeconds),
    `${task.credits} credits`,
    task.status === "queued" && queuePosition ? `#${queuePosition}` : undefined,
  ].filter(Boolean);

  return (
    <article className="queue-panel rounded-lg p-4 transition-colors duration-200 hover:border-[#e85420]/25 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[#3a2f29] bg-[#141110] text-[#e85420] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-medium leading-5 text-[#f6f0eb]">{task.prompt}</p>
            <StatusBadge status={task.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#9f9188]">
            <span className="rounded-full border border-white/10 bg-[#0e0b0a]/60 px-2 py-1 font-mono text-[#d8ccc4]">{task.model}</span>
            {meta.map((item) => (
              <span key={item} className="rounded-full bg-white/[0.05] px-2 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      {task.status === "running" && (
        <div className="mt-4">
          <ProgressBar value={task.progress} />
        </div>
      )}
      {task.status === "failed" && task.error && <p className="mt-4 text-sm text-red-200">{task.error}</p>}
      <div className="mt-4">
        <TaskActions status={task.status} onCancel={() => onCancel(task.id)} onRetry={() => onRetry(task.id)} onDelete={() => onDelete(task.id)} />
      </div>
    </article>
  );
}
