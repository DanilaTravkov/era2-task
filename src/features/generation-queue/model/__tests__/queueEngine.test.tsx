import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { MAX_CONCURRENT } from "../queueReducer";
import { buildQueueTick, QUEUE_TICK_MS, useQueueEngine } from "../queueEngine";
import type { QueueAction } from "../types";

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: "task-1",
    type: "image",
    model: "GPT-4o",
    prompt: "Generate a product image",
    status: "running",
    progress: 20,
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-06-24T09:00:00.000Z",
    credits: 12,
    ...overrides,
  };
}

function EngineHarness({
  tasks,
  enabled,
  dispatch,
}: {
  tasks: GenerationTask[];
  enabled: boolean;
  dispatch: React.Dispatch<QueueAction>;
}) {
  useQueueEngine(tasks, dispatch, enabled);
  return null;
}

describe("queueEngine", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses the required two-task concurrency limit", () => {
    expect(MAX_CONCURRENT).toBe(2);
  });

  it("builds tick updates only for running tasks and keeps video slower than text", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const updates = buildQueueTick([
      task({ id: "text-1", type: "text", progress: 10 }),
      task({ id: "video-1", type: "video", progress: 10 }),
      task({ id: "queued-1", status: "queued", progress: 0 }),
      task({ id: "failed-1", status: "failed", progress: 50 }),
    ]);

    expect(updates.map((update) => update.taskId)).toEqual(["text-1", "video-1"]);
    expect(updates.find((update) => update.taskId === "text-1")?.progressDelta).toBeGreaterThan(
      updates.find((update) => update.taskId === "video-1")?.progressDelta ?? 0,
    );
  });

  it("marks an update as failed when the task reaches its planned failure progress", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const [update] = buildQueueTick([task({ id: "will-fail", progress: 55, failAtProgress: 50 })]);

    expect(update).toMatchObject({
      taskId: "will-fail",
      fail: true,
    });
    expect(update.error).toBeTruthy();
  });

  it("dispatches interval ticks when enabled and clears the interval on unmount", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn<React.Dispatch<QueueAction>>();
    const { unmount } = render(
      <EngineHarness tasks={[task({ id: "running-1" })]} enabled dispatch={dispatch} />,
    );

    vi.advanceTimersByTime(QUEUE_TICK_MS);

    expect(dispatch).toHaveBeenCalled();
    const callsBeforeStop = dispatch.mock.calls.length;

    unmount();
    vi.advanceTimersByTime(QUEUE_TICK_MS * 3);

    expect(dispatch).toHaveBeenCalledTimes(callsBeforeStop);
  });

  it("does not dispatch ticks while disabled", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn<React.Dispatch<QueueAction>>();

    render(<EngineHarness tasks={[task({ id: "running-1" })]} enabled={false} dispatch={dispatch} />);
    vi.advanceTimersByTime(QUEUE_TICK_MS * 2);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

