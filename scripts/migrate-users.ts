import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log(
    "[migrate:users] DATABASE_URL não configurada; migração ignorada neste ambiente."
  );
  process.exit(0);
}

const connection = await mysql.createConnection(databaseUrl);

try {
  // The production TiDB database may have been created from the original
  // schema, before accessStatus/accessExpiresAt were added to users.
  // CREATE TABLE IF NOT EXISTS is safe for already-populated databases.
  await connection.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL,
    name VARCHAR(255) NULL,
    email VARCHAR(320) NULL,
    loginMethod VARCHAR(64) NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    accessStatus ENUM('active','suspended') NOT NULL DEFAULT 'active',
    accessExpiresAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY users_openId_unique (openId)
  )`);

  const baselineTables = [
    `CREATE TABLE IF NOT EXISTS access_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL,
      phone VARCHAR(32) NULL,
      companyName VARCHAR(255) NULL,
      jobTitle VARCHAR(160) NULL,
      status ENUM('requested','approved','rejected') NOT NULL DEFAULT 'requested',
      credentialHash VARCHAR(255) NULL,
      accessExpiresAt TIMESTAMP NULL,
      approvedByUserId INT NULL,
      approvedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY access_requests_email_unique (email),
      INDEX access_requests_status_idx (status, createdAt)
    )`,
    `CREATE TABLE IF NOT EXISTS workspaces (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      kind ENUM('autonomo','clt') NOT NULL,
      ownerUserId INT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY workspaces_owner_kind_unique (ownerUserId, kind)
    )`,
    `CREATE TABLE IF NOT EXISTS workspace_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workspaceId INT NOT NULL,
      userId INT NOT NULL,
      role ENUM('owner','manager','member') NOT NULL DEFAULT 'member',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY workspace_member_unique (workspaceId, userId),
      INDEX workspace_members_user_idx (userId)
    )`,
    `CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workspaceId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      document VARCHAR(32) NULL,
      logoKey VARCHAR(512) NULL,
      logoUrl VARCHAR(1024) NULL,
      brandPrimaryColor VARCHAR(7) NULL,
      brandBackgroundColor VARCHAR(7) NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX companies_workspace_idx (workspaceId)
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      stripeCustomerId VARCHAR(255) NULL,
      stripeSubscriptionId VARCHAR(255) NULL,
      stripePriceId VARCHAR(255) NULL,
      planCode VARCHAR(64) NOT NULL,
      status VARCHAR(64) NOT NULL,
      currentPeriodEnd TIMESTAMP NULL,
      cancelAtPeriodEnd BOOLEAN NOT NULL DEFAULT FALSE,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY subscriptions_userId_unique (userId),
      INDEX subscriptions_customer_idx (stripeCustomerId)
    )`,
  ];

  for (const statement of baselineTables) await connection.execute(statement);

  const columns: Array<[string, string]> = [
    ["openId", "VARCHAR(64) NOT NULL"],
    ["name", "VARCHAR(255) NULL"],
    ["email", "VARCHAR(320) NULL"],
    ["loginMethod", "VARCHAR(64) NULL"],
    ["role", "ENUM('user','admin') NOT NULL DEFAULT 'user'"],
    ["accessStatus", "ENUM('active','suspended') NOT NULL DEFAULT 'active'"],
    ["accessExpiresAt", "TIMESTAMP NULL"],
    ["createdAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    [
      "updatedAt",
      "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ],
    ["lastSignedIn", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ];

  for (const [columnName, definition] of columns) {
    const [existing] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW COLUMNS FROM `users` LIKE ?",
      [columnName]
    );
    if (existing.length) continue;
    await connection.query(
      `ALTER TABLE \`users\` ADD COLUMN \`${columnName}\` ${definition}`
    );
  }

  const [uniqueOpenIdIndexes] = await connection.query<mysql.RowDataPacket[]>(
    "SHOW INDEX FROM `users` WHERE Column_name = 'openId' AND Non_unique = 0"
  );
  if (!uniqueOpenIdIndexes.length) {
    await connection.query(
      "ALTER TABLE `users` ADD UNIQUE INDEX `users_openId_unique` (`openId`)"
    );
  }

  console.log("[migrate:users] Estrutura de usuários atualizada.");
} finally {
  await connection.end();
}
