import { Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
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
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#e85420] shadow-[0_0_16px_rgba(232,84,32,0.55)]" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
          <span className="truncate font-medium text-[#f6f0eb]">
            {typeLabels[task.type]} · {task.model}
          </span>
          <span className="shrink-0 font-mono text-[#c8bbb2]">{Math.round(task.progress)}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#0e0b0a] ring-1 ring-white/10">
          <div className="queue-progress-fill h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />
        </div>
      </div>
    </div>
  );
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      aria-label="Закрыть уведомление о генерациях"
      onClick={onDismiss}
      className="queue-focus rounded-md border border-white/10 bg-[#0e0b0a]/70 p-1.5 text-[#c8bbb2] hover:border-[#e85420]/40 hover:text-white"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function OneTaskStatus({ task, onDismiss }: { task: GenerationTask; onDismiss: () => void }) {
  return (
    <div className="queue-panel relative w-full rounded-lg px-4 py-3 pr-12 backdrop-blur transition duration-200 hover:border-[#e85420]/40 sm:w-[360px]">
      <Link to="/queue" aria-label="Открыть очередь генераций" className="flex items-center gap-3 text-left">
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
      <DismissButton onDismiss={onDismiss} />
    </div>
  );
}

function MultiTaskStatus({ tasks, averageProgress, onDismiss }: { tasks: GenerationTask[]; averageProgress: number; onDismiss: () => void }) {
  return (
    <div className="queue-panel relative w-full rounded-lg p-4 backdrop-blur transition duration-200 sm:w-[390px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#f6f0eb]">Генерации в процессе</h2>
          <p className="mt-1 text-xs text-[#c8bbb2]">
            {tasks.length} активны · {averageProgress}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#e85420]" aria-hidden="true" />
          <DismissButton onDismiss={onDismiss} />
        </div>
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
        className="queue-focus mt-4 inline-flex w-full items-center justify-center rounded-md border border-[#e85420] bg-[#e85420] px-3 py-2 text-sm font-medium text-white hover:-translate-y-0.5 hover:bg-[#ff6a35]"
      >
        Открыть очередь →
      </Link>
    </div>
  );
}

export function GenerationStatusBar() {
  const { state } = useQueue();
  const [dismissed, setDismissed] = useState(false);
  const activeTasks = useMemo(() => selectActiveTasks(state.tasks), [state.tasks]);
  const averageProgress = useMemo(() => getAverageProgress(activeTasks), [activeTasks]);
  const visible = !dismissed && state.hydrated && !state.loading && !state.error && activeTasks.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0 sm:pb-0"
        >
          {activeTasks.length === 1 ? (
            <OneTaskStatus task={activeTasks[0]} onDismiss={() => setDismissed(true)} />
          ) : (
            <MultiTaskStatus tasks={activeTasks} averageProgress={averageProgress} onDismiss={() => setDismissed(true)} />
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
