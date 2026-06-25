import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Dispatch, PropsWithChildren } from "react";
import { generationTaskSeed } from "@/entities/generation-task";
import type { GenerationTask } from "@/entities/generation-task";
import { queueInitialState, queueReducer } from "./queueReducer";
import { useQueueEngine } from "./queueEngine";
import type { QueueAction, QueueState } from "./types";

const QUEUE_STORAGE_KEY = "era2:generation-queue:v1";
const HYDRATION_DELAY_MS = 600;

export interface QueueContextValue {
  state: QueueState;
  dispatch: Dispatch<QueueAction>;
  retryInitialLoad: () => void;
}

export const QueueContext = createContext<QueueContextValue | null>(null);

const cloneSeedTasks = () => generationTaskSeed.map((task) => ({ ...task }));

function readStoredTasks(): GenerationTask[] | null {
  try {
    const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GenerationTask[]).map((task) => ({ ...task })) : null;
  } catch {
    return null;
  }
}

function persistTasks(tasks: GenerationTask[]) {
  try {
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export interface QueueProviderProps extends PropsWithChildren {
  initialLoadShouldFail?: boolean;
}

export function QueueProvider({ children, initialLoadShouldFail = false }: QueueProviderProps) {
  const [state, dispatch] = useReducer(queueReducer, queueInitialState);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const failedInitialLoadRef = useRef(false);

  useEffect(() => {
    dispatch({ type: "queue/load-start" });

    const timeoutId = window.setTimeout(() => {
      if (initialLoadShouldFail && !failedInitialLoadRef.current) {
        failedInitialLoadRef.current = true;
        dispatch({ type: "queue/load-failure", error: "Не удалось загрузить очередь. Попробуйте ещё раз." });
        return;
      }
      dispatch({
        type: "queue/load-success",
        tasks: readStoredTasks() ?? cloneSeedTasks(),
        now: new Date().toISOString(),
      });
    }, HYDRATION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [initialLoadShouldFail, loadAttempt]);

  useEffect(() => {
    if (state.hydrated && !state.loading && !state.error) persistTasks(state.tasks);
  }, [state.error, state.hydrated, state.loading, state.tasks]);

  const retryInitialLoad = useCallback(() => setLoadAttempt((attempt) => attempt + 1), []);
  useQueueEngine(state.tasks, dispatch, state.hydrated && !state.loading && !state.error);
  const value = useMemo(() => ({ state, dispatch, retryInitialLoad }), [retryInitialLoad, state]);
  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}
