import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Create a lazy connection to avoid build-time errors
function createClient() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your environment variables."
    );
  }
  // Disable prefetch as it is not supported for "Transaction" pool mode
  return postgres(connectionString, { prepare: false });
}

// Lazy initialization - the connection is only created when first used
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    _db = drizzle(createClient(), { schema });
  }
  return _db;
}

// For backwards compatibility, export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof typeof _db];
  },
});

export * from "./schema";
