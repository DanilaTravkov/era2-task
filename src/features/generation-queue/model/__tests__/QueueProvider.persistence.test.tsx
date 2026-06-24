import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { QueueProvider } from "../QueueProvider";
import { useQueue } from "../useQueue";

const storageKey = "era2:generation-queue:v1";

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

function QueueProbe() {
  const queue = useQueue();

  return (
    <div>
      <output aria-label="loading">{String(queue.state.loading)}</output>
      <output aria-label="hydrated">{String(queue.state.hydrated)}</output>
      <output aria-label="ids">{queue.state.tasks.map((item) => `${item.id}:${item.status}`).join(",")}</output>
      <button type="button" onClick={() => queue.cancelTask("persist-running")}>
        cancel
      </button>
    </div>
  );
}

describe("QueueProvider persistence", () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("restores stored tasks from localStorage and normalizes active work through the queue reducer", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        task({
          id: "persist-running",
          status: "running",
          progress: 50,
          createdAt: "2026-06-24T09:00:00.000Z",
        }),
        task({
          id: "persist-queued",
          status: "queued",
          createdAt: "2026-06-24T09:05:00.000Z",
        }),
      ]),
    );

    render(
      <QueueProvider>
        <QueueProbe />
      </QueueProvider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => expect(screen.getByLabelText("hydrated").textContent).toBe("true"));
    expect(screen.getByLabelText("ids").textContent).toContain("persist-running:running");
    expect(screen.getByLabelText("ids").textContent).toContain("persist-queued:running");
  });

  it("persists queue changes after hydration without a backend", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      storageKey,
      JSON.stringify([task({ id: "persist-running", status: "running", progress: 35 })]),
    );

    render(
      <QueueProvider>
        <QueueProbe />
      </QueueProvider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    await waitFor(() => expect(screen.getByLabelText("hydrated").textContent).toBe("true"));

    screen.getByRole("button", { name: "cancel" }).click();

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as GenerationTask[];
      expect(stored.find((item) => item.id === "persist-running")?.status).toBe("canceled");
    });
  });
});

