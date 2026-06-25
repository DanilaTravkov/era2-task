import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { RouterProvider } from "@/shared/routing";
import { QueueContext } from "../../model/QueueProvider";
import type { QueueContextValue } from "../../model/QueueProvider";
import { GenerationStatusBar } from "../GenerationStatusBar";

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: "task-1",
    type: "image",
    model: "GPT-4o Image",
    prompt: "Собрать промо-изображение для ERA2",
    status: "queued",
    progress: 0,
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-06-24T09:00:00.000Z",
    credits: 12,
    ...overrides,
  };
}

function renderWithQueue(tasks: GenerationTask[], children: ReactNode = <GenerationStatusBar />) {
  const value: QueueContextValue = {
    state: {
      tasks,
      hydrated: true,
      loading: false,
    },
    dispatch: vi.fn(),
    retryInitialLoad: vi.fn(),
  };

  return render(
    <RouterProvider>
      <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
    </RouterProvider>,
  );
}

describe("GenerationStatusBar", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.scrollTo = vi.fn();
  });

  it("is hidden when there are no queued or running tasks", () => {
    renderWithQueue([
      task({ id: "done", status: "done", progress: 100 }),
      task({ id: "failed", status: "failed", error: "Недостаточно кредитов" }),
      task({ id: "canceled", status: "canceled" }),
    ]);

    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.queryByRole("link", { name: /открыть очередь/i })).toBeNull();
  });

  it("renders one active task as a compact status link to /queue", () => {
    renderWithQueue([
      task({
        id: "single-running",
        status: "running",
        type: "image",
        model: "Midjourney",
        progress: 42,
      }),
    ]);

    const link = screen.getByRole("link", { name: /открыть очередь генераций/i });
    expect(link.getAttribute("href")).toBe("/queue");
    expect(within(link).getByText("Изображение · Midjourney")).toBeTruthy();
    expect(within(link).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("42");

    fireEvent.click(link);
    expect(window.location.pathname).toBe("/queue");
  });

  it("renders multiple active tasks with count, average progress, limited mini-list, and queue link", () => {
    renderWithQueue([
      task({
        id: "running-old",
        status: "running",
        type: "video",
        model: "Runway",
        progress: 80,
        createdAt: "2026-06-24T09:00:00.000Z",
      }),
      task({
        id: "queued-new",
        status: "queued",
        type: "image",
        model: "Stable Diffusion",
        progress: 80,
        createdAt: "2026-06-24T09:15:00.000Z",
      }),
      task({
        id: "running-new",
        status: "running",
        type: "text",
        model: "GPT-4o",
        progress: 40,
        createdAt: "2026-06-24T09:10:00.000Z",
      }),
      task({
        id: "queued-old",
        status: "queued",
        type: "audio",
        model: "ElevenLabs",
        progress: 20,
        createdAt: "2026-06-24T09:05:00.000Z",
      }),
    ]);

    const bar = screen.getByRole("complementary");
    expect(within(bar).getByText("Генерации идут")).toBeTruthy();
    expect(within(bar).getByText("4 активны · 55%")).toBeTruthy();
    expect(within(bar).getByRole("progressbar").getAttribute("aria-valuenow")).toBe("55");
    expect(within(bar).getByText("Видео · Runway")).toBeTruthy();
    expect(within(bar).getByText("Текст · GPT-4o")).toBeTruthy();
    expect(within(bar).getByText("Аудио · ElevenLabs")).toBeTruthy();
    expect(within(bar).queryByText("Изображение · Stable Diffusion")).toBeNull();

    const link = within(bar).getByRole("link", { name: /открыть очередь/i });
    expect(link.getAttribute("href")).toBe("/queue");
    fireEvent.click(link);
    expect(window.location.pathname).toBe("/queue");
  });
});
