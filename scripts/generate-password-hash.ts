import { randomBytes, scryptSync } from "node:crypto";

const password = process.env.MASTER_ADMIN_PASSWORD;
if (!password) {
  console.error(
    "Defina MASTER_ADMIN_PASSWORD somente no ambiente local para gerar o hash."
  );
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
