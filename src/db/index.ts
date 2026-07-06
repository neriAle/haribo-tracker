import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

const url =
  import.meta.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken =
  import.meta.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("Database URL is missing!");
}

const client = createClient({
  url: url as string,
  authToken: authToken as string | undefined,
});

export const db = drizzle(client, { schema });
