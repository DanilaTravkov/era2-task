import { useMemo, useState } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import { EmptyState, ErrorState, LoadingState, QueueStats, QueueToolbar, TaskCard, TaskRow, selectQueueStats, selectVisibleTasks, useQueue, type QueueControls } from "@/features/generation-queue";

const SKIP_DELETE_CONFIRM_KEY = "era2:generation-queue:skip-delete-confirm";

export function GenerationQueue() {
  const { state, cancelTask, retryTask, deleteTask, retryInitialLoad } = useQueue();
  const [controls, setControls] = useState<QueueControls>({ status: "all", sort: "newest", search: "" });
  const [pendingDelete, setPendingDelete] = useState<GenerationTask | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(
    () => window.localStorage.getItem(SKIP_DELETE_CONFIRM_KEY) === "true",
  );
  const stats = useMemo(() => selectQueueStats(state.tasks), [state.tasks]);
  const visibleTasks = useMemo(() => selectVisibleTasks(state.tasks, controls), [controls, state.tasks]);
  const emptyVariant = state.tasks.length === 0 ? "queue" : "results";
  const queuePositions = useMemo(() => {
    const positions = new Map<string, number>();
    state.tasks
      .filter((task) => task.status === "queued")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .forEach((task, index) => positions.set(task.id, index + 1));
    return positions;
  }, [state.tasks]);
  const requestDelete = (task: GenerationTask) => {
    if (skipDeleteConfirm) deleteTask(task.id);
    else setPendingDelete(task);
  };
  const confirmDelete = (task: GenerationTask, remember: boolean) => {
    if (remember) {
      window.localStorage.setItem(SKIP_DELETE_CONFIRM_KEY, "true");
      setSkipDeleteConfirm(true);
    }
    deleteTask(task.id);
    setPendingDelete(null);
  };
  return (
    <section className="min-h-screen bg-[#0e0b0a] px-3 py-6 text-[#f6efe9] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <header className="flex flex-col gap-2 rounded-lg border border-white/[0.07] bg-[#141110]/70 p-4 sm:p-5">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e85420]">ERA2</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Очередь генераций</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#c8bbb2] sm:text-base">
            Следите за текстовыми, графическими, видео- и аудиозадачами в едином списке.
          </p>
        </header>
        {state.loading ? (
          <LoadingState />
        ) : state.error ? (
          <ErrorState message={state.error} onRetry={retryInitialLoad} />
        ) : (
          <>
            <QueueStats stats={stats} />
            <QueueToolbar controls={controls} onControlsChange={setControls} />
            {visibleTasks.length === 0 ? (
              <EmptyState variant={emptyVariant} />
            ) : (
              <>
                <div className="queue-panel overflow-hidden rounded-lg">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-[#c8bbb2]">
                    <span>Задачи</span>
                    <span className="font-mono">
                      {visibleTasks.length} / {state.tasks.length}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    {visibleTasks.map((task) => (
                      <TaskRow key={task.id} task={task} queuePosition={queuePositions.get(task.id)} onCancel={cancelTask} onRetry={retryTask} onDelete={requestDelete} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 lg:hidden">
                  {visibleTasks.map((task) => (
                    <TaskCard key={task.id} task={task} queuePosition={queuePositions.get(task.id)} onCancel={cancelTask} onRetry={retryTask} onDelete={requestDelete} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      {pendingDelete && (
        <DeleteTaskDialog
          task={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

function DeleteTaskDialog({
  task,
  onCancel,
  onConfirm,
}: {
  task: GenerationTask;
  onCancel: () => void;
  onConfirm: (task: GenerationTask, remember: boolean) => void;
}) {
  const [remember, setRemember] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
      <div className="queue-panel w-full max-w-md rounded-lg p-5">
        <h2 id="delete-task-title" className="text-lg font-semibold">Удалить задачу?</h2>
        <p className="mt-3 text-sm leading-6 text-[#c8bbb2]">
          Вы уверены что хотите удалить задачу "{task.prompt}"?
        </p>
        <label className="mt-4 flex items-center gap-3 text-sm text-[#d8ccc4]">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-[#e85420]" />
          Больше не спрашивать
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="queue-focus rounded-md border border-white/10 px-4 py-2 text-sm text-[#c8bbb2] hover:border-[#e85420]/40">
            Отмена
          </button>
          <button type="button" onClick={() => onConfirm(task, remember)} className="queue-focus rounded-md border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25">
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
