import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

const PGR_IFRAME_AUDIENCE = "portal-tst-pgr";
const PGR_IFRAME_TTL_SECONDS = 90;

export type PgrIframeTicket = {
  userId: number;
  workspaceId: number;
  projectId: number;
  userRole: "admin" | "user";
};

function ticketSecret() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET não configurado para o PGR.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createPgrIframeTicket(ticket: PgrIframeTicket): Promise<string> {
  return new SignJWT({
    purpose: "pgr-iframe",
    userId: ticket.userId,
    workspaceId: ticket.workspaceId,
    projectId: ticket.projectId,
    userRole: ticket.userRole,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(PGR_IFRAME_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PGR_IFRAME_TTL_SECONDS}s`)
    .sign(ticketSecret());
}

export async function verifyPgrIframeTicket(token: string | undefined): Promise<PgrIframeTicket | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ticketSecret(), {
      algorithms: ["HS256"],
      audience: PGR_IFRAME_AUDIENCE,
    });
    if (
      payload.purpose !== "pgr-iframe" ||
      typeof payload.userId !== "number" ||
      !Number.isSafeInteger(payload.userId) ||
      typeof payload.workspaceId !== "number" ||
      !Number.isSafeInteger(payload.workspaceId) ||
      typeof payload.projectId !== "number" ||
      !Number.isSafeInteger(payload.projectId) ||
      (payload.userRole !== "admin" && payload.userRole !== "user")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      userRole: payload.userRole,
    };
  } catch {
    return null;
  }
}
