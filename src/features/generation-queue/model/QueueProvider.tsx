import { createContext, useEffect, useMemo, useReducer } from "react";
import type { Dispatch, PropsWithChildren } from "react";
import { generationTaskSeed } from "@/entities/generation-task";
import { queueInitialState, queueReducer } from "./queueReducer";
import { useQueueEngine } from "./queueEngine";
import type { QueueAction, QueueState } from "./types";

export interface QueueContextValue {
  state: QueueState;
  dispatch: Dispatch<QueueAction>;
}

export const QueueContext = createContext<QueueContextValue | null>(null);

const cloneSeedTasks = () => generationTaskSeed.map((task) => ({ ...task }));

export function QueueProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(queueReducer, queueInitialState);

  useEffect(() => {
    dispatch({
      type: "queue/load-success",
      tasks: cloneSeedTasks(),
      now: new Date().toISOString(),
    });
  }, []);

  useQueueEngine(state.tasks, dispatch, state.hydrated && !state.loading);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}
