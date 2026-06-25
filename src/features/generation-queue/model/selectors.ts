import type { GenerationTask } from "@/entities/generation-task";
import type { QueueControls, QueueStatsSnapshot } from "./types";

const byNewest = (left: GenerationTask, right: GenerationTask) => right.createdAt.localeCompare(left.createdAt);
const byOldest = (left: GenerationTask, right: GenerationTask) => left.createdAt.localeCompare(right.createdAt);

export function selectQueueStats(tasks: GenerationTask[]): QueueStatsSnapshot {
  return tasks.reduce(
    (stats, task) => {
      if (task.status === "queued" || task.status === "running" || task.status === "done" || task.status === "failed") {
        stats[task.status] += 1;
      }
      return stats;
    },
    { queued: 0, running: 0, done: 0, failed: 0 },
  );
}

export function selectVisibleTasks(tasks: GenerationTask[], controls: QueueControls): GenerationTask[] {
  const search = controls.search.trim().toLowerCase();

  return tasks
    .filter((task) => {
      const byStatus = controls.status === "all" || task.status === controls.status;
      const bySearch = search === "" || task.prompt.toLowerCase().includes(search);
      return byStatus && bySearch;
    })
    .sort(controls.sort === "oldest" ? byOldest : byNewest);
}
