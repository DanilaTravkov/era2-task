import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { GenerationQueue } from "../GenerationQueue";

const queueTasks = vi.hoisted(() => ({ current: [] as GenerationTask[] }));

vi.mock("@/features/generation-queue", async (original) => ({
  ...(await original<typeof import("@/features/generation-queue")>()),
  useQueue: () => ({
    state: { tasks: queueTasks.current, loading: false, hydrated: true },
    cancelTask: vi.fn(),
    retryTask: vi.fn(),
    deleteTask: vi.fn(),
    retryInitialLoad: vi.fn(),
  }),
}));

const task = (index: number): GenerationTask => ({
  id: `task-${index}`,
  type: "image",
  model: "FLUX Pro",
  prompt: `Очередь ${String(index).padStart(2, "0")}`,
  status: "queued",
  progress: 0,
  createdAt: new Date(Date.UTC(2026, 5, 24, 9, index)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 5, 24, 9, index)).toISOString(),
  credits: 12,
});

describe("GenerationQueue virtualized mock pages", () => {
  afterEach(() => {
    vi.useRealTimers();
    queueTasks.current = [];
  });

  it("renders tasks in mock request pages of 10", async () => {
    vi.useFakeTimers();
    queueTasks.current = Array.from({ length: 23 }, (_, index) => task(index + 1));

    render(<GenerationQueue />);

    expect(screen.getByText("10 / 23")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 13")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Показать ещё 10" }));
    await act(async () => vi.advanceTimersByTime(300));

    expect(screen.getByText("20 / 23")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 13").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Очередь 03")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Показать ещё 10" }));
    await act(async () => vi.advanceTimersByTime(300));

    expect(screen.getByText("23 / 23")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 03").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Показать ещё 10" })).toBeNull();
  });
});
