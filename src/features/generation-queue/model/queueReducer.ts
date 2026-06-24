import type { GenerationTask } from "@/entities/generation-task";
import type { QueueAction, QueueState, QueueTickUpdate } from "./types";

export const MAX_CONCURRENT = 2;

export const queueInitialState: QueueState = {
  tasks: [],
  loading: true,
  hydrated: false,
};

const byCreatedAt = (left: GenerationTask, right: GenerationTask) => left.createdAt.localeCompare(right.createdAt);
const isActive = (task: GenerationTask) => task.status === "queued" || task.status === "running";

function fillSlots(tasks: GenerationTask[], now?: string): GenerationTask[] {
  const keepRunning = new Set(
    tasks
      .filter((task) => task.status === "running")
      .sort(byCreatedAt)
      .slice(0, MAX_CONCURRENT)
      .map((task) => task.id),
  );
  const slots = MAX_CONCURRENT - keepRunning.size;
  const start = new Set(
    tasks
      .filter((task) => task.status === "queued")
      .sort(byCreatedAt)
      .slice(0, slots)
      .map((task) => task.id),
  );

  return tasks.map((task) => {
    if (task.status === "running" && !keepRunning.has(task.id)) {
      return { ...task, status: "queued", startedAt: undefined, updatedAt: now ?? task.updatedAt };
    }
    if (start.has(task.id)) {
      return {
        ...task,
        status: "running",
        startedAt: task.startedAt ?? now ?? task.updatedAt,
        updatedAt: now ?? task.updatedAt,
        completedAt: undefined,
      };
    }
    return task;
  });
}

function resetRunning(tasks: GenerationTask[]) {
  return tasks.map((task) =>
    task.status === "running" ? { ...task, status: "queued", startedAt: undefined, completedAt: undefined } : task,
  );
}

function tickTask(task: GenerationTask, update: QueueTickUpdate, now: string): GenerationTask {
  if (update.fail) {
    return {
      ...task,
      status: "failed",
      error: update.error?.trim() || "Модель временно недоступна",
      updatedAt: now,
      completedAt: now,
    };
  }

  const progress = Math.min(100, Math.max(0, task.progress + update.progressDelta));
  return progress >= 100
    ? { ...task, status: "done", progress: 100, error: undefined, updatedAt: now, completedAt: now }
    : { ...task, progress, updatedAt: now };
}

function applyTick(tasks: GenerationTask[], updates: QueueTickUpdate[], now: string) {
  const updateById = new Map(updates.map((update) => [update.taskId, update]));
  return fillSlots(
    tasks.map((task) => {
      const update = updateById.get(task.id);
      return update && task.status === "running" ? tickTask(task, update, now) : task;
    }),
    now,
  );
}

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "queue/load-start":
      return { ...state, loading: true, hydrated: false, error: undefined };
    case "queue/load-success":
      return { tasks: fillSlots(resetRunning(action.tasks), action.now), loading: false, hydrated: true };
    case "queue/load-failure":
      return { ...state, loading: false, hydrated: true, error: action.error };
    case "queue/start":
      return { ...state, tasks: fillSlots(state.tasks, action.now) };
    case "queue/engine-tick":
      return { ...state, tasks: applyTick(state.tasks, action.updates, action.now) };
    case "queue/cancel":
      return {
        ...state,
        tasks: fillSlots(
          state.tasks.map((task) =>
            task.id === action.taskId && isActive(task)
              ? { ...task, status: "canceled", updatedAt: action.now, completedAt: action.now }
              : task,
          ),
          action.now,
        ),
      };
    case "queue/retry":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId && (task.status === "failed" || task.status === "canceled")
            ? {
                ...task,
                status: "queued",
                progress: 0,
                createdAt: action.now,
                updatedAt: action.now,
                startedAt: undefined,
                completedAt: undefined,
                error: undefined,
                failAtProgress: undefined,
              }
            : task,
        ),
      };
    case "queue/delete":
      return { ...state, tasks: fillSlots(state.tasks.filter((task) => task.id !== action.taskId)) };
    case "queue/clear-done":
      return { ...state, tasks: state.tasks.filter((task) => task.status !== "done") };
    default:
      return state;
  }
}
