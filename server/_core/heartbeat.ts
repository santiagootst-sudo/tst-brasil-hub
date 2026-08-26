import { TRPCError } from "@trpc/server";

export type HeartbeatJob = {
  name: string;
  cron: string;
  path: string;
  method?: "POST" | "PUT";
  payload?: unknown;
  description?: string;
};

export type HeartbeatJobUpdate = Partial<Omit<HeartbeatJob, "name">> & {
  enable?: boolean;
};

export type HeartbeatJobInfo = {
  taskUid: string;
  name: string;
  userId: string;
  description: string;
  cronExpression: string;
  callbackPath: string;
  callbackMethod: string;
  callbackPayload: string;
  isEnable: boolean;
  createdAt?: string | null;
  lastExecutedAt?: string | null;
  nextExecutionAt?: string | null;
};

function schedulerDisabled(): never {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message: "Agendamento recorrente não está configurado. Use um cron job do Render ou um scheduler externo sob seu controle.",
  });
}

export async function createHeartbeatJob(_job: HeartbeatJob, _userSession: string): Promise<{ taskUid: string; nextExecutionAt?: string | null }> {
  return schedulerDisabled();
}

export async function updateHeartbeatJob(_taskUid: string, _patch: HeartbeatJobUpdate, _userSession: string): Promise<{ nextExecutionAt?: string | null }> {
  return schedulerDisabled();
}

export async function deleteHeartbeatJob(_taskUid: string, _userSession: string): Promise<void> {
  return schedulerDisabled();
}

export async function listHeartbeatJobs(_userSession: string, _pagination?: { page?: number; pageSize?: number }): Promise<{ total: number; actorUserId: string; jobs: HeartbeatJobInfo[] }> {
  return schedulerDisabled();
}
