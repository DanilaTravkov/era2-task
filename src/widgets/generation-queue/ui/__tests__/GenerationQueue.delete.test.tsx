import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { GenerationQueue } from "../GenerationQueue";

const deleteTask = vi.fn();

vi.mock("@/features/generation-queue", async (original) => ({
  ...(await original<typeof import("@/features/generation-queue")>()),
  useQueue: () => ({
    state: { tasks: [task()], loading: false, hydrated: true },
    cancelTask: vi.fn(),
    retryTask: vi.fn(),
    deleteTask,
    retryInitialLoad: vi.fn(),
  }),
}));

const task = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
  id: "delete-me",
  type: "image",
  model: "FLUX Pro",
  prompt: "Минималистичный постер ERA2: технические детали не показываются в модальном окне",
  status: "queued",
  progress: 0,
  createdAt: "2026-06-24T09:00:00.000Z",
  updatedAt: "2026-06-24T09:00:00.000Z",
  credits: 12,
  ...overrides,
});

describe("GenerationQueue delete confirmation", () => {
  beforeEach(() => {
    deleteTask.mockClear();
    localStorage.clear();
  });

  it("confirms deletion and remembers the skip preference", () => {
    render(<GenerationQueue />);

    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole("heading", { level: 3, name: "FLUX Pro" })).toBeTruthy();
    expect(within(dialog).getByText("Минималистичный постер ERA2")).toBeTruthy();
    expect(within(dialog).queryByText(/технические детали/i)).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Больше не спрашивать" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Удалить" }));

    expect(deleteTask).toHaveBeenCalledWith("delete-me");
    expect(localStorage.getItem("era2:generation-queue:skip-delete-confirm")).toBe("true");
  });

  it("skips the dialog after the user stores that preference", () => {
    localStorage.setItem("era2:generation-queue:skip-delete-confirm", "true");
    render(<GenerationQueue />);

    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" })[0]);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(deleteTask).toHaveBeenCalledWith("delete-me");
  });
});
