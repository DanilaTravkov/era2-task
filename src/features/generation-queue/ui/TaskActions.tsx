import { Download, MoreHorizontal, RotateCcw, X, type LucideIcon } from "lucide-react";
import type { TaskStatus } from "@/entities/generation-task";

interface TaskActionsProps {
  status: TaskStatus;
  onCancel: () => void;
  onRetry: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}

const buttonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[#c8bbb2] hover:border-[#e85420]/50 hover:text-[#f6f0eb]";

export function TaskActions({ status, onCancel, onRetry, onDelete, onDownload }: TaskActionsProps) {
  const primary: false | { label: string; Icon: LucideIcon; onClick?: () => void } =
    (status === "queued" || status === "running") && { label: "Отменить", Icon: X, onClick: onCancel } ||
    (status === "failed" || status === "canceled") && { label: "Повторить", Icon: RotateCcw, onClick: onRetry } ||
    status === "done" && { label: "Скачать", Icon: Download, onClick: onDownload };

  return (
    <div className="flex items-center justify-end gap-2">
      {primary && (
        <button type="button" onClick={primary.onClick} className={buttonClass} aria-label={primary.label} title={primary.label}>
          <primary.Icon className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={onDelete} className={buttonClass} aria-label="Удалить" title="Удалить">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
