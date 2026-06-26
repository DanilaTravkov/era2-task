import { describe, expect, it } from "vitest";
import type { GenType, TaskStatus } from "@/entities/generation-task";
import { generationTaskSeed } from "@/entities/generation-task";

const REQUIRED_TYPES: GenType[] = ["text", "image", "video", "audio"];
const REQUIRED_STATUS_COUNTS: Partial<Record<TaskStatus, number>> = {
  running: 2,
};
const MOJIBAKE_MARKERS = /[ÐÑ]/;

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => ({
      ...counts,
      [value]: (counts[value] ?? 0) + 1,
    }),
    {} as Record<T, number>,
  );
}

describe("generationTaskSeed", () => {
  it("contains 21 scaffold tasks for the virtualized queue demo", () => {
    expect(generationTaskSeed).toHaveLength(21);
  });

  it("covers every generation type required by the domain", () => {
    const seedTypes = new Set(generationTaskSeed.map((task) => task.type));

    expect([...seedTypes].sort()).toEqual([...REQUIRED_TYPES].sort());
  });

  it("provides the initial live-screen status mix", () => {
    const statusCounts = countBy(generationTaskSeed.map((task) => task.status));

    expect(statusCounts.running).toBe(REQUIRED_STATUS_COUNTS.running);
    expect(statusCounts.queued).toBeGreaterThanOrEqual(3);
    expect((statusCounts.running ?? 0) + (statusCounts.queued ?? 0)).toBeGreaterThanOrEqual(8);
    expect(statusCounts.done).toBeGreaterThanOrEqual(1);
    expect(statusCounts.failed).toBeGreaterThanOrEqual(1);
  });

  it("uses unique task ids and valid progress values", () => {
    const ids = generationTaskSeed.map((task) => task.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
    expect(generationTaskSeed.every((task) => Number.isFinite(task.progress))).toBe(true);
    expect(generationTaskSeed.every((task) => task.progress >= 0 && task.progress <= 100)).toBe(true);
  });

  it("keeps user-facing seed strings free of mojibake markers", () => {
    const corruptedFields = generationTaskSeed.flatMap((task) =>
      [
        ["prompt", task.prompt],
        ["error", task.error],
        ["resultLabel", task.resultLabel],
      ].flatMap(([field, value]) =>
        typeof value === "string" && MOJIBAKE_MARKERS.test(value)
          ? [`${task.id}.${field}: ${value}`]
          : [],
      ),
    );

    expect(corruptedFields).toEqual([]);
  });
});
