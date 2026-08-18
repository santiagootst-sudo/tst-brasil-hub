import { z } from "zod";
import { createAccessRequest } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const requestAccessInput = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo.").max(255),
  email: z.string().trim().email("Informe um e-mail válido.").max(320),
  phone: z.string().trim().max(32).optional(),
  companyName: z.string().trim().max(255).optional(),
  jobTitle: z.string().trim().max(160).optional(),
});

export const accessRouter = router({
  request: publicProcedure.input(requestAccessInput).mutation(async ({ input }) => {
    const record = await createAccessRequest(input);
    return { id: record.id, status: record.status, alreadyRequested: record.status !== "requested" };
  }),
});
