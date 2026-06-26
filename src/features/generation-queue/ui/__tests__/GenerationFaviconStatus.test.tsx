import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { QueueContext, type QueueContextValue } from "../../model/QueueProvider";
import { GenerationFaviconStatus } from "../GenerationFaviconStatus";

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: "task-1",
    type: "image",
    model: "FLUX Pro",
    prompt: "Промо-изображение",
    status: "queued",
    progress: 0,
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-06-24T09:00:00.000Z",
    credits: 12,
    ...overrides,
  };
}

function renderWithQueue(tasks: GenerationTask[], children: ReactNode = <GenerationFaviconStatus />) {
  const value: QueueContextValue = {
    state: { tasks, hydrated: true, loading: false },
    dispatch: vi.fn(),
    retryInitialLoad: vi.fn(),
  };

  return render(<QueueContext.Provider value={value}>{children}</QueueContext.Provider>);
}

const faviconHref = () => document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.getAttribute("href");

describe("GenerationFaviconStatus", () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />';
  });

  it("switches favicon while queue has active tasks and restores it afterwards", () => {
    const view = renderWithQueue([]);
    expect(faviconHref()).toBe("/favicon.svg");

    view.rerender(
      <QueueContext.Provider
        value={{
          state: { tasks: [task({ status: "running", progress: 44 })], hydrated: true, loading: false },
          dispatch: vi.fn(),
          retryInitialLoad: vi.fn(),
        }}
      >
        <GenerationFaviconStatus />
      </QueueContext.Provider>,
    );
    expect(faviconHref()).toMatch(/^data:image\/svg\+xml/);

    view.rerender(
      <QueueContext.Provider
        value={{
          state: { tasks: [task({ status: "done", progress: 100 })], hydrated: true, loading: false },
          dispatch: vi.fn(),
          retryInitialLoad: vi.fn(),
        }}
      >
        <GenerationFaviconStatus />
      </QueueContext.Provider>,
    );
    expect(faviconHref()).toBe("/favicon.svg");
  });
});
