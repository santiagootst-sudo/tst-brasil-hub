import { Resend } from "resend";
import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }
  return { title, content };
};

/** Envia notificação administrativa por e-mail, sem depender da Manus. */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  if (
    !ENV.resendApiKey ||
    !ENV.resendFromEmail ||
    !ENV.ownerNotificationEmail
  ) {
    console.warn(
      "[Notification] Resend não configurado; notificação não enviada."
    );
    return false;
  }

  try {
    const resend = new Resend(ENV.resendApiKey);
    const result = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: [ENV.ownerNotificationEmail],
      subject: title,
      text: content,
    });
    if (result.error) {
      console.warn(
        "[Notification] Resend rejected notification:",
        result.error.message
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Resend request failed:", error);
    return false;
  }
}
