import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GenerationTask } from "@/entities/generation-task";
import { MAX_CONCURRENT } from "../queueReducer";
import { QueueProvider } from "../QueueProvider";
import { useQueue } from "../useQueue";

const seed = vi.hoisted<GenerationTask[]>(() => [
  { id: "running", type: "image", model: "GPT-4o", prompt: "Run", status: "running", progress: 40, createdAt: "1", updatedAt: "1", credits: 12 },
  { id: "queued-old", type: "text", model: "GPT-4o", prompt: "Old", status: "queued", progress: 0, createdAt: "2", updatedAt: "2", credits: 4 },
  { id: "queued-new", type: "audio", model: "Suno", prompt: "New", status: "queued", progress: 0, createdAt: "3", updatedAt: "3", credits: 8 },
  { id: "failed", type: "video", model: "Runway", prompt: "Fail", status: "failed", progress: 35, createdAt: "0", updatedAt: "0", credits: 20 },
]);

vi.mock("@/entities/generation-task", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/generation-task")>()),
  generationTaskSeed: seed,
}));

function Probe() {
  const queue = useQueue();
  const ids = queue.state.tasks.map((task) => `${task.id}:${task.status}`).join(",");

  return (
    <div>
      <output aria-label="hydrated">{String(queue.state.hydrated)}</output>
      <output aria-label="ids">{ids}</output>
      <button onClick={() => queue.cancelTask("running")}>cancel</button>
      <button onClick={() => queue.retryTask("failed")}>retry</button>
      <button onClick={() => queue.deleteTask("queued-new")}>delete</button>
    </div>
  );
}

describe("QueueProvider and useQueue", () => {
  it("hydrates seed tasks through the reducer and exposes reducer-backed helpers", async () => {
    render(
      <QueueProvider>
        <Probe />
      </QueueProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText("hydrated").textContent).toBe("true"));
    let ids = screen.getByLabelText("ids").textContent ?? "";
    expect(ids).toContain("running:running");
    expect(ids).toContain("queued-old:running");
    expect(ids.match(/:running/g)).toHaveLength(MAX_CONCURRENT);

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    await waitFor(() => expect(screen.getByLabelText("ids").textContent).toContain("running:canceled"));

    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    ids = screen.getByLabelText("ids").textContent ?? "";
    expect(ids).toContain("failed:queued");

    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(screen.getByLabelText("ids").textContent).not.toContain("queued-new");
  });
});
