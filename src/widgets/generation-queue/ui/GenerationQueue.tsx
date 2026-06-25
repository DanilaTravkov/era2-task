import { useMemo, useState } from "react";
import {
  QueueProvider,
  QueueStats,
  QueueToolbar,
  selectQueueStats,
  selectVisibleTasks,
  useQueue,
  type QueueControls,
} from "@/features/generation-queue";

export function GenerationQueue() {
  return (
    <QueueProvider>
      <GenerationQueueContent />
    </QueueProvider>
  );
}

function GenerationQueueContent() {
  const { state } = useQueue();
  const [controls, setControls] = useState<QueueControls>({
    status: "all",
    sort: "newest",
    search: "",
  });
  const stats = useMemo(() => selectQueueStats(state.tasks), [state.tasks]);
  const visibleTasks = useMemo(() => selectVisibleTasks(state.tasks, controls), [controls, state.tasks]);

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
        <QueueStats stats={stats} />
        <QueueToolbar controls={controls} onControlsChange={setControls} />
        <div className="rounded-lg border border-white/10 bg-[#211a16] px-4 py-3 text-sm text-[#c8bbb2]">
          Показано {visibleTasks.length} из {state.tasks.length}
        </div>
      </div>
    </section>
  );
}
