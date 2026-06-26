import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { MAX_CONCURRENT } from "../queueReducer";
import { QueueProvider } from "../QueueProvider";
import { useQueue } from "../useQueue";

const key = "era2:generation-queue:v1";

vi.mock("../queueEngine", async (original) => ({
  ...(await original<typeof import("../queueEngine")>()),
  useQueueEngine: vi.fn(),
}));

const task = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
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
});
const advance = async (ms: number) => act(async () => vi.advanceTimersByTime(ms));
const stored = () => JSON.parse(localStorage.getItem(key) ?? "[]") as GenerationTask[];
const activeCount = (ids: string) =>
  ids.split(",").filter((item) => item.endsWith(":queued") || item.endsWith(":running")).length;

function Probe() {
  const queue = useQueue();
  const ids = queue.state.tasks.map((item) => `${item.id}:${item.status}`).join(",");
  const running = queue.state.tasks.filter((item) => item.status === "running").length;
  return (
    <div>
      <output aria-label="loading">{String(queue.state.loading)}</output>
      <output aria-label="hydrated">{String(queue.state.hydrated)}</output>
      <output aria-label="error">{queue.state.error ?? ""}</output>
      <output aria-label="ids">{ids}</output>
      <output aria-label="running">{running}</output>
      <button onClick={() => queue.cancelTask("persist-a")}>cancel</button>
      <button onClick={queue.retryInitialLoad}>retry load</button>
    </div>
  );
}

describe("QueueProvider persistence", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("delays hydration for 600ms and restores normalized localStorage tasks", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      key,
      JSON.stringify([
        task({ id: "persist-a", status: "running", createdAt: "2026-06-24T09:00:00.000Z" }),
        task({ id: "persist-b", status: "running", createdAt: "2026-06-24T09:05:00.000Z" }),
        task({ id: "persist-c", status: "running", createdAt: "2026-06-24T09:10:00.000Z" }),
      ]),
    );

    render(<QueueProvider><Probe /></QueueProvider>);
    expect(screen.getByLabelText("loading").textContent).toBe("true");
    await advance(599);
    expect(screen.getByLabelText("hydrated").textContent).toBe("false");
    await advance(1);
    expect(screen.getByLabelText("hydrated").textContent).toBe("true");
    expect(screen.getByLabelText("running").textContent).toBe(String(MAX_CONCURRENT));
    expect(screen.getByLabelText("ids").textContent).toContain("persist-c:queued");
  });

  it("persists queue changes only after hydration", async () => {
    vi.useFakeTimers();
    localStorage.setItem(key, JSON.stringify([task({ id: "persist-a", status: "running" })]));
    render(<QueueProvider><Probe /></QueueProvider>);

    await advance(599);
    expect(stored()[0].status).toBe("running");
    await advance(1);
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(stored().find((item) => item.id === "persist-a")?.status).toBe("canceled");
  });

  it("completes stale persisted queues with the full seed dataset", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      key,
      JSON.stringify(
        Array.from({ length: 10 }, (_, index) =>
          task({
            id: `gen-${1001 + index}`,
            status: index < 2 ? "running" : "queued",
            createdAt: `2026-06-24T09:${String(index).padStart(2, "0")}:00.000Z`,
          }),
        ),
      ),
    );

    render(<QueueProvider><Probe /></QueueProvider>);

    await advance(600);
    expect(activeCount(screen.getByLabelText("ids").textContent ?? "")).toBeGreaterThan(6);
    expect(stored()).toHaveLength(21);
  });

  it("reactivates stale completed seed tasks for the live demo flow", async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      key,
      JSON.stringify(
        Array.from({ length: 8 }, (_, index) =>
          task({
            id: `gen-100${index + 1}`,
            status: "done",
            progress: 100,
            createdAt: `2026-06-24T09:0${index}:00.000Z`,
          }),
        ),
      ),
    );

    render(<QueueProvider><Probe /></QueueProvider>);

    await advance(600);
    expect(activeCount(screen.getByLabelText("ids").textContent ?? "")).toBeGreaterThan(6);
  });

  it("shows a controlled init error and retries successfully", async () => {
    vi.useFakeTimers();
    render(<QueueProvider initialLoadShouldFail><Probe /></QueueProvider>);

    await advance(600);
    expect(screen.getByLabelText("error").textContent).not.toBe("");
    fireEvent.click(screen.getByRole("button", { name: "retry load" }));
    await advance(600);
    expect(screen.getByLabelText("error").textContent).toBe("");
    expect(screen.getByLabelText("hydrated").textContent).toBe("true");
  });
});
