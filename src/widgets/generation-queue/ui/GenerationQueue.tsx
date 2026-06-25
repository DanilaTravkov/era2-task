import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState, QueueProvider, QueueStats, QueueToolbar, TaskCard, TaskRow, selectQueueStats, selectVisibleTasks, useQueue, type QueueControls } from "@/features/generation-queue";

export function GenerationQueue() {
  return (
    <QueueProvider>
      <GenerationQueueContent />
    </QueueProvider>
  );
}

function GenerationQueueContent() {
  const { state, cancelTask, retryTask, deleteTask, retryInitialLoad } = useQueue();
  const [controls, setControls] = useState<QueueControls>({ status: "all", sort: "newest", search: "" });
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
  return (
    <section className="min-h-screen bg-[#17120f] px-4 py-8 text-[#f6f0eb] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
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
                <div className="overflow-hidden rounded-lg border border-white/10 bg-[#211a16]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-[#c8bbb2]">
                    <span>Задачи</span>
                    <span className="font-mono">
                      {visibleTasks.length} / {state.tasks.length}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    {visibleTasks.map((task) => (
                      <TaskRow key={task.id} task={task} queuePosition={queuePositions.get(task.id)} onCancel={cancelTask} onRetry={retryTask} onDelete={deleteTask} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 lg:hidden">
                  {visibleTasks.map((task) => (
                    <TaskCard key={task.id} task={task} queuePosition={queuePositions.get(task.id)} onCancel={cancelTask} onRetry={retryTask} onDelete={deleteTask} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
