import type { GenerationTask, TaskStatus } from "@/entities/generation-task";

export interface QueueState {
  tasks: GenerationTask[];
  loading: boolean;
  hydrated: boolean;
  error?: string;
}

export interface QueueTickUpdate {
  taskId: string;
  progressDelta: number;
  fail?: boolean;
  error?: string;
}

export type QueueStatusFilter = Extract<TaskStatus, "queued" | "running" | "done" | "failed"> | "all";
export type QueueSort = "newest" | "oldest";

export interface QueueControls {
  status: QueueStatusFilter;
  sort: QueueSort;
  search: string;
}

export interface QueueStatsSnapshot {
  queued: number;
  running: number;
  done: number;
  failed: number;
}

export type QueueAction =
  | { type: "queue/load-start" }
  | { type: "queue/load-success"; tasks: GenerationTask[]; now?: string }
  | { type: "queue/load-failure"; error: string }
  | { type: "queue/start"; now?: string }
  | { type: "queue/engine-tick"; updates: QueueTickUpdate[]; now: string }
  | { type: "queue/cancel"; taskId: string; now: string }
  | { type: "queue/retry"; taskId: string; now: string }
  | { type: "queue/delete"; taskId: string }
  | { type: "queue/clear-done" };
