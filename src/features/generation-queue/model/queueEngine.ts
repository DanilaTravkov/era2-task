import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import type { QueueAction, QueueTickUpdate } from "./types";

export const QUEUE_TICK_MS = 900;

const FAILURE_ERRORS = [
  "Недостаточно кредитов",
  "Превышено время ожидания",
  "Модель временно недоступна",
] as const;

const STEP_BY_TYPE: Record<GenerationTask["type"], { min: number; max: number }> = {
  text: { min: 3, max: 6 },
  image: { min: 2, max: 5 },
  audio: { min: 2, max: 4 },
  video: { min: 1, max: 3 },
};

const pickError = () => FAILURE_ERRORS[Math.floor(Math.random() * FAILURE_ERRORS.length)] ?? FAILURE_ERRORS[0];

const nextProgressDelta = (task: GenerationTask) => {
  const speed = STEP_BY_TYPE[task.type];
  return Math.round(speed.min + Math.random() * (speed.max - speed.min));
};

function shouldFailTask(task: GenerationTask, nextProgress: number) {
  if (typeof task.failAtProgress === "number") {
    return nextProgress >= task.failAtProgress;
  }

  return task.progress < 45 && nextProgress >= 45 && Math.random() < 0.08;
}

export function buildQueueTick(tasks: GenerationTask[]): QueueTickUpdate[] {
  return tasks
    .filter((task) => task.status === "running")
    .map((task) => {
      const progressDelta = nextProgressDelta(task);
      const nextProgress = Math.min(100, task.progress + progressDelta);

      return shouldFailTask(task, nextProgress)
        ? { taskId: task.id, progressDelta, fail: true, error: pickError() }
        : { taskId: task.id, progressDelta };
    });
}

export function useQueueEngine(
  tasks: GenerationTask[],
  dispatch: Dispatch<QueueAction>,
  enabled: boolean,
) {
  const tasksRef = useRef(tasks);
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const updates = buildQueueTick(tasksRef.current);

      if (updates.length > 0) {
        dispatchRef.current({
          type: "queue/engine-tick",
          updates,
          now: new Date().toISOString(),
        });
      }
    }, QUEUE_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled]);
}
