import dotenv from "dotenv";
import { cleanEnv, host, port, str } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  HOST: host({
    default: "0.0.0.0",
  }),
  PORT: port({
    default: 3000,
  }),
  DATABASE_URL: str(),
});
