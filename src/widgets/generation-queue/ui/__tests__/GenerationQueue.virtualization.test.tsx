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

  it("renders 21 tasks in scroll-loaded mock request pages of 7", async () => {
    vi.useFakeTimers();
    queueTasks.current = Array.from({ length: 21 }, (_, index) => task(index + 1));
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1700 });

    render(<GenerationQueue />);

    expect(screen.getByText("7 / 21")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 14")).toHaveLength(0);

    await act(async () => {
      fireEvent.scroll(window);
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("14 / 21")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 14").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Очередь 07")).toHaveLength(0);

    await act(async () => {
      fireEvent.scroll(window);
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("21 / 21")).toBeTruthy();
    expect(screen.queryAllByText("Очередь 07").length).toBeGreaterThan(0);
    expect(screen.queryByText("Загрузка...")).toBeNull();
  });
});
