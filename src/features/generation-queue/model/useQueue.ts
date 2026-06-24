import { useCallback, useContext } from "react";
import { QueueContext } from "./QueueProvider";

const now = () => new Date().toISOString();

export function useQueue() {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error("useQueue must be used within QueueProvider");
  }

  const { dispatch } = context;

  const cancelTask = useCallback(
    (taskId: string) => dispatch({ type: "queue/cancel", taskId, now: now() }),
    [dispatch],
  );
  const retryTask = useCallback(
    (taskId: string) => dispatch({ type: "queue/retry", taskId, now: now() }),
    [dispatch],
  );
  const deleteTask = useCallback((taskId: string) => dispatch({ type: "queue/delete", taskId }), [dispatch]);
  const clearDone = useCallback(() => dispatch({ type: "queue/clear-done" }), [dispatch]);

  return {
    ...context,
    cancelTask,
    retryTask,
    deleteTask,
    clearDone,
  };
}
