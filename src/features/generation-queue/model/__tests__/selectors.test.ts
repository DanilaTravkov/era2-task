import { describe, expect, it } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import {
  selectActiveTasks,
  selectAverageActiveProgress,
  selectQueuePosition,
  selectQueueStats,
  selectVisibleTasks,
} from "../selectors";
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
  type: "all",
  sort: "newest",
  search: "",
};

describe("generation queue selectors", () => {
  const tasks: GenerationTask[] = [
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

  it("returns reactive counters for queue summary cards", () => {
    expect(selectQueueStats(tasks)).toEqual({
      queued: 2,
      running: 1,
      done: 1,
      failed: 1,
    });
  });

  it("selects active tasks and average progress for the global status bar", () => {
    expect(selectActiveTasks(tasks).map((item) => item.id)).toEqual([
      "new-running",
      "old-queued",
      "second-queued",
    ]);
    expect(selectAverageActiveProgress(tasks)).toBe(20);
  });

  it("filters by status, searches prompt/model text, and sorts by creation time", () => {
    expect(selectVisibleTasks(tasks, { ...baseControls, search: "image", sort: "newest" }).map((item) => item.id)).toEqual([
      "failed",
    ]);
    expect(selectVisibleTasks(tasks, { ...baseControls, status: "queued", sort: "oldest" }).map((item) => item.id)).toEqual([
      "old-queued",
      "second-queued",
    ]);
    expect(selectQueuePosition(tasks, "second-queued")).toBe(2);
  });

  it("filters by generation type and supports status/progress sorting modes", () => {
    expect(selectVisibleTasks(tasks, { ...baseControls, type: "audio" }).map((item) => item.id)).toEqual([
      "second-queued",
    ]);
    expect(selectVisibleTasks(tasks, { ...baseControls, sort: "status" }).map((item) => item.id)).toEqual([
      "new-running",
      "old-queued",
      "second-queued",
      "failed",
      "done",
      "canceled",
    ]);
    expect(selectVisibleTasks(tasks, { ...baseControls, sort: "progress" })[0].id).toBe("done");
  });
});

