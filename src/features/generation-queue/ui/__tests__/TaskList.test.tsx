import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GenerationTask, TaskStatus } from "@/entities/generation-task";
import { StatusBadge } from "../StatusBadge";
import { TaskCard } from "../TaskCard";
import { TaskRow } from "../TaskRow";

const task = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
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
});
const actions = () => ({ onCancel: vi.fn(), onRetry: vi.fn(), onDelete: vi.fn() });

describe("generation queue task list UI", () => {
  it.each<[TaskStatus, string]>([
    ["queued", "В очереди"],
    ["running", "Идёт"],
    ["done", "Готово"],
    ["failed", "Ошибка"],
    ["canceled", "Отменено"],
  ])("maps %s status to the Russian badge label", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it("shows running progress and cancel action in row and card layouts", () => {
    const callbacks = actions();
    const running = task({ id: "running-task", status: "running", progress: 67, etaSeconds: 120 });
    render(<><TaskRow task={running} {...callbacks} /><TaskCard task={running} {...callbacks} /></>);

    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(screen.getAllByText("67%")).toHaveLength(2);
    screen.getAllByRole("button", { name: /отмен/i }).forEach((button) => fireEvent.click(button));
    expect(callbacks.onCancel).toHaveBeenCalledTimes(2);
    expect(callbacks.onCancel).toHaveBeenCalledWith("running-task");
  });

  it("shows failed error and retry action", () => {
    const callbacks = actions();
    render(<TaskRow task={task({ id: "failed-task", status: "failed", error: "Модель временно недоступна" })} {...callbacks} />);

    expect(screen.getByText("Модель временно недоступна")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /повторить/i }));
    expect(callbacks.onRetry).toHaveBeenCalledWith("failed-task");
  });

  it("exposes done download placeholder and delete action", () => {
    const callbacks = actions();
    render(<TaskCard task={task({ id: "done-task", status: "done", progress: 100, resultLabel: "result.png" })} {...callbacks} />);
    const card = screen.getByText("Собрать промо-изображение для ERA2").closest("article") ?? document.body;

    expect(within(card).getByRole("button", { name: /скачать/i })).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: /удалить/i }));
    expect(callbacks.onDelete).toHaveBeenCalledWith("done-task");
  });
});
