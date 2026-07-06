import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";
// @ts-expect-error - Virtual module provided by Cloudflare adapter
import { env as cfEnv } from "cloudflare:workers";

const url = cfEnv?.TURSO_DATABASE_URL ?? import.meta.env.TURSO_DATABASE_URL;
const authToken = cfEnv?.TURSO_AUTH_TOKEN ?? import.meta.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
