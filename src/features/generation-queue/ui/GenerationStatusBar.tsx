import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import type { GenerationTask, GenType } from "@/entities/generation-task";
import { Link } from "@/shared/routing";
import { selectActiveTasks } from "../model/selectors";
import { useQueue } from "../model/useQueue";
import { ProgressBar } from "./ProgressBar";

const typeLabels: Record<GenType, string> = {
  text: "Текст",
  image: "Изображение",
  video: "Видео",
  audio: "Аудио",
};

function getAverageProgress(tasks: GenerationTask[]) {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / tasks.length);
}

function TaskSummary({ task }: { task: GenerationTask }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#e85420]" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
          <span className="truncate font-medium text-[#f6f0eb]">
            {typeLabels[task.type]} · {task.model}
          </span>
          <span className="shrink-0 font-mono text-[#c8bbb2]">{Math.round(task.progress)}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#e85420] transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />
        </div>
      </div>
    </div>
  );
}

function OneTaskStatus({ task }: { task: GenerationTask }) {
  return (
    <Link
      to="/queue"
      aria-label="Открыть очередь генераций"
      className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-[#211a16]/95 px-4 py-3 text-left shadow-2xl shadow-black/30 backdrop-blur transition hover:border-[#e85420]/40 sm:w-[360px]"
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#e85420]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#f6f0eb]">
          {typeLabels[task.type]} · {task.model}
        </p>
        <div className="mt-2">
          <ProgressBar value={task.progress} />
        </div>
      </div>
    </Link>
  );
}

function MultiTaskStatus({ tasks, averageProgress }: { tasks: GenerationTask[]; averageProgress: number }) {
  return (
    <div className="w-full rounded-lg border border-white/10 bg-[#211a16]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:w-[390px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#f6f0eb]">Генерации идут</h2>
          <p className="mt-1 text-xs text-[#c8bbb2]">
            {tasks.length} активны · {averageProgress}%
          </p>
        </div>
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#e85420]" aria-hidden="true" />
      </div>
      <div className="mt-3">
        <ProgressBar value={averageProgress} />
      </div>
      <div className="mt-4 grid gap-3">
        {tasks.slice(0, 3).map((task) => (
          <TaskSummary key={task.id} task={task} />
        ))}
      </div>
      <Link
        to="/queue"
        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#e85420] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#ff6a35]"
      >
        Открыть очередь →
      </Link>
    </div>
  );
}

export function GenerationStatusBar() {
  const { state } = useQueue();
  const activeTasks = useMemo(() => selectActiveTasks(state.tasks), [state.tasks]);
  const averageProgress = useMemo(() => getAverageProgress(activeTasks), [activeTasks]);

  if (!state.hydrated || state.loading || state.error || activeTasks.length === 0) return null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0 sm:pb-0">
      {activeTasks.length === 1 ? (
        <OneTaskStatus task={activeTasks[0]} />
      ) : (
        <MultiTaskStatus tasks={activeTasks} averageProgress={averageProgress} />
      )}
    </aside>
  );
}
