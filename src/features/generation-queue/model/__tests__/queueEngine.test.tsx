import { render } from "@testing-library/react";
import type { Dispatch } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { MAX_CONCURRENT } from "../queueReducer";
import { buildQueueTick, QUEUE_TICK_MS, useQueueEngine } from "../queueEngine";
import type { QueueAction } from "../types";

const task = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
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
});

function Harness(props: { tasks: GenerationTask[]; enabled: boolean; dispatch: Dispatch<QueueAction> }) {
  useQueueEngine(props.tasks, props.dispatch, props.enabled);
  return null;
}

describe("queueEngine", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("builds running-only ticks with slower video/audio progress and deterministic failures", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const updates = buildQueueTick([
      task({ id: "text-1", type: "text" }),
      task({ id: "image-1", type: "image" }),
      task({ id: "video-1", type: "video" }),
      task({ id: "audio-1", type: "audio" }),
      task({ id: "queued-1", status: "queued" }),
      task({ id: "will-fail", progress: 55, failAtProgress: 50 }),
    ]);
    const delta = new Map(updates.map((update) => [update.taskId, update.progressDelta]));

    expect(MAX_CONCURRENT).toBe(2);
    expect(updates.map((update) => update.taskId)).toEqual(["text-1", "image-1", "video-1", "audio-1", "will-fail"]);
    expect(Math.min(delta.get("text-1") ?? 0, delta.get("image-1") ?? 0)).toBeGreaterThan(
      Math.max(delta.get("video-1") ?? 0, delta.get("audio-1") ?? 0),
    );
    expect(updates.find((update) => update.taskId === "will-fail")).toMatchObject({
      fail: true,
      error: expect.stringMatching(/[А-Яа-яЁё]/),
    });
  });

  it("does not keep rolling random failures after the decision window", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const [update] = buildQueueTick([task({ id: "safe-progress", progress: 60 })]);

    expect(update?.taskId).toBe("safe-progress");
    expect(update?.fail).toBeUndefined();
  });

  it("dispatches interval ticks only while enabled and clears the interval", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn<Dispatch<QueueAction>>();
    const { rerender, unmount } = render(<Harness tasks={[task()]} enabled dispatch={dispatch} />);

    vi.advanceTimersByTime(QUEUE_TICK_MS);
    expect(dispatch).toHaveBeenCalledTimes(1);

    rerender(<Harness tasks={[task()]} enabled={false} dispatch={dispatch} />);
    vi.advanceTimersByTime(QUEUE_TICK_MS * 2);
    expect(dispatch).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(QUEUE_TICK_MS * 2);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
