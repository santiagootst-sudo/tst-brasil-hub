export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  masterAdminEmail: (
    process.env.MASTER_ADMIN_EMAIL ?? "santiagoocorretor@gmail.com"
  )
    .trim()
    .toLowerCase(),
  masterAdminPasswordHash: process.env.MASTER_ADMIN_PASSWORD_HASH ?? "",
  isProduction: process.env.NODE_ENV === "production",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  openAiApiBase: (
    process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1"
  ).replace(/\/+$/, ""),
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "",
  ownerNotificationEmail: (
    process.env.OWNER_NOTIFICATION_EMAIL ??
    process.env.MASTER_ADMIN_EMAIL ??
    ""
  )
    .trim()
    .toLowerCase(),
};
