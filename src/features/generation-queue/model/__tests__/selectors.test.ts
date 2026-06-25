import { describe, expect, it } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { selectActiveTasks, selectQueueStats, selectVisibleTasks } from "../selectors";
import type { QueueControls } from "../types";

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: "task-1",
    type: "image",
    model: "GPT-4o",
    prompt: "Generate a warm product hero",
    status: "queued",
    progress: 0,
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-06-24T09:00:00.000Z",
    credits: 12,
    ...overrides,
  };
}

const baseControls: QueueControls = {
  status: "all",
  sort: "newest",
  search: "",
};

describe("generation queue selectors", () => {
  const tasks: GenerationTask[] = [
    task({
      id: "old-running",
      status: "running",
      prompt: "Voiceover script",
      createdAt: "2026-06-24T09:05:00.000Z",
      progress: 30,
    }),
    task({
      id: "new-running",
      status: "running",
      prompt: "Studio portrait",
      createdAt: "2026-06-24T09:30:00.000Z",
      progress: 60,
    }),
    task({ id: "old-queued", status: "queued", prompt: "Landing page copy", createdAt: "2026-06-24T09:10:00.000Z" }),
    task({ id: "done", status: "done", prompt: "Audio intro", createdAt: "2026-06-24T09:20:00.000Z", progress: 100 }),
    task({
      id: "failed",
      status: "failed",
      prompt: "Poster image",
      createdAt: "2026-06-24T09:40:00.000Z",
      error: "Превышено время ожидания",
    }),
    task({ id: "canceled", status: "canceled", prompt: "Video teaser", createdAt: "2026-06-24T09:50:00.000Z" }),
    task({
      id: "second-queued",
      status: "queued",
      prompt: "Audio backing track",
      type: "audio",
      createdAt: "2026-06-24T09:15:00.000Z",
    }),
  ];

  it("returns queued/running/done/failed counters for queue summary cards", () => {
    expect(selectQueueStats(tasks)).toEqual({
      queued: 2,
      running: 2,
      done: 1,
      failed: 1,
    });
  });

  it("returns active tasks with running first and queued tasks in FIFO order", () => {
    expect(selectActiveTasks(tasks).map((item) => item.id)).toEqual([
      "old-running",
      "new-running",
      "old-queued",
      "second-queued",
    ]);
  });

  it("filters by status and sorts by newest or oldest creation time", () => {
    expect(selectVisibleTasks(tasks, { ...baseControls, status: "queued", sort: "newest" }).map((item) => item.id)).toEqual([
      "second-queued",
      "old-queued",
    ]);
    expect(selectVisibleTasks(tasks, { ...baseControls, status: "queued", sort: "oldest" }).map((item) => item.id)).toEqual([
      "old-queued",
      "second-queued",
    ]);
  });

  it("searches prompt text case-insensitively and preserves selected sort order", () => {
    expect(selectVisibleTasks(tasks, { ...baseControls, search: "IMAGE", sort: "newest" }).map((item) => item.id)).toEqual([
      "failed",
    ]);
    expect(selectVisibleTasks(tasks, { ...baseControls, search: "audio", sort: "oldest" }).map((item) => item.id)).toEqual([
      "second-queued",
      "done",
    ]);
  });
});

