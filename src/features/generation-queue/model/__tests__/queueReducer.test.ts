import { describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { MAX_CONCURRENT, queueInitialState, queueReducer } from "../queueReducer";
import type { QueueState } from "../types";

const now = "2026-06-24T10:00:00.000Z";

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: "task-1",
    type: "image",
    model: "GPT-4o",
    prompt: "Generate a product image",
    status: "queued",
    progress: 0,
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-06-24T09:00:00.000Z",
    credits: 12,
    ...overrides,
  };
}

function state(tasks: GenerationTask[]): QueueState {
  return {
    ...queueInitialState,
    tasks,
    loading: false,
    hydrated: true,
  };
}

describe("queueReducer", () => {
  it("hydrates restored running tasks through the queued flow and respects MAX_CONCURRENT = 2", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const initialTasks = [
      task({
        id: "stored-running",
        status: "running",
        progress: 42,
        createdAt: "2026-06-24T09:00:00.000Z",
      }),
      task({ id: "old-queued", status: "queued", createdAt: "2026-06-24T08:00:00.000Z" }),
      task({ id: "new-queued", status: "queued", createdAt: "2026-06-24T09:30:00.000Z" }),
    ];

    const next = queueReducer(queueInitialState, { type: "queue/load-success", tasks: initialTasks });

    expect(next.hydrated).toBe(true);
    expect(next.tasks.filter((item) => item.status === "running")).toHaveLength(MAX_CONCURRENT);
    expect(next.tasks.find((item) => item.id === "old-queued")?.status).toBe("running");
    expect(next.tasks.find((item) => item.id === "stored-running")?.status).toBe("running");
    expect(next.tasks.find((item) => item.id === "new-queued")?.status).toBe("queued");

    vi.restoreAllMocks();
  });

  it("advances running task progress to done and immediately fills the freed slot FIFO", () => {
    const current = state([
      task({ id: "running-1", status: "running", progress: 96, createdAt: "2026-06-24T09:00:00.000Z" }),
      task({ id: "running-2", status: "running", progress: 30, createdAt: "2026-06-24T09:05:00.000Z" }),
      task({ id: "queued-old", status: "queued", createdAt: "2026-06-24T09:10:00.000Z" }),
      task({ id: "queued-new", status: "queued", createdAt: "2026-06-24T09:20:00.000Z" }),
    ]);

    const next = queueReducer(current, {
      type: "queue/engine-tick",
      now,
      updates: [{ taskId: "running-1", progressDelta: 8 }],
    });

    expect(next.tasks.find((item) => item.id === "running-1")).toMatchObject({
      status: "done",
      progress: 100,
      completedAt: now,
    });
    expect(next.tasks.find((item) => item.id === "queued-old")?.status).toBe("running");
    expect(next.tasks.find((item) => item.id === "queued-new")?.status).toBe("queued");
    expect(next.tasks.filter((item) => item.status === "running")).toHaveLength(MAX_CONCURRENT);
  });

  it("fails a running task with a readable error and refills the available slot", () => {
    const current = state([
      task({ id: "running-1", status: "running", progress: 45 }),
      task({ id: "queued-1", status: "queued", createdAt: "2026-06-24T09:10:00.000Z" }),
    ]);

    const next = queueReducer(current, {
      type: "queue/engine-tick",
      now,
      updates: [{ taskId: "running-1", progressDelta: 1, fail: true, error: "Недостаточно кредитов" }],
    });

    expect(next.tasks.find((item) => item.id === "running-1")).toMatchObject({
      status: "failed",
      error: "Недостаточно кредитов",
      completedAt: now,
    });
    expect(next.tasks.find((item) => item.id === "queued-1")?.status).toBe("running");
  });

  it("supports cancel, retry, delete, and clear-done user actions", () => {
    const current = state([
      task({ id: "running-1", status: "running", progress: 42 }),
      task({ id: "failed-1", status: "failed", progress: 66, error: "Превышено время ожидания" }),
      task({ id: "done-1", status: "done", progress: 100 }),
      task({ id: "queued-1", status: "queued" }),
    ]);

    const canceled = queueReducer(current, { type: "queue/cancel", taskId: "running-1", now });
    expect(canceled.tasks.find((item) => item.id === "running-1")).toMatchObject({
      status: "canceled",
      completedAt: now,
    });

    const retried = queueReducer(canceled, { type: "queue/retry", taskId: "failed-1", now });
    expect(retried.tasks.find((item) => item.id === "failed-1")).toMatchObject({
      status: "queued",
      progress: 0,
      error: undefined,
      createdAt: now,
    });

    const deleted = queueReducer(retried, { type: "queue/delete", taskId: "queued-1" });
    expect(deleted.tasks.some((item) => item.id === "queued-1")).toBe(false);

    const cleared = queueReducer(deleted, { type: "queue/clear-done" });
    expect(cleared.tasks.some((item) => item.status === "done")).toBe(false);
  });
});

