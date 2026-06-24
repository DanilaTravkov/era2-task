export type GenType = "text" | "image" | "video" | "audio";

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface GenerationTask {
  id: string;
  type: GenType;
  model: string;
  prompt: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  etaSeconds?: number;
  durationSeconds?: number;
  credits: number;
  error?: string;
  resultLabel?: string;
  failAtProgress?: number;
}
