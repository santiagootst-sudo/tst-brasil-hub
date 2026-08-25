import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("[migrate:users] DATABASE_URL não configurada; migração ignorada neste ambiente.");
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

  const columns: Array<[string, string]> = [
    ["openId", "VARCHAR(64) NOT NULL"],
    ["name", "VARCHAR(255) NULL"],
    ["email", "VARCHAR(320) NULL"],
    ["loginMethod", "VARCHAR(64) NULL"],
    ["role", "ENUM('user','admin') NOT NULL DEFAULT 'user'"],
    ["accessStatus", "ENUM('active','suspended') NOT NULL DEFAULT 'active'"],
    ["accessExpiresAt", "TIMESTAMP NULL"],
    ["createdAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updatedAt", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
    ["lastSignedIn", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ];

  for (const [columnName, definition] of columns) {
    const [existing] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW COLUMNS FROM `users` LIKE ?",
      [columnName],
    );
    if (existing.length) continue;
    await connection.query(`ALTER TABLE \`users\` ADD COLUMN \`${columnName}\` ${definition}`);
  }

  const [uniqueOpenIdIndexes] = await connection.query<mysql.RowDataPacket[]>(
    "SHOW INDEX FROM `users` WHERE Column_name = 'openId' AND Non_unique = 0",
  );
  if (!uniqueOpenIdIndexes.length) {
    await connection.query("ALTER TABLE `users` ADD UNIQUE INDEX `users_openId_unique` (`openId`)");
  }

  console.log("[migrate:users] Estrutura de usuários atualizada.");
} finally {
  await connection.end();
}
