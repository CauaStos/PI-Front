import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://onstage:onstage@localhost:5433/onstage"

export const queryClient = postgres(connectionString, { max: 10 })
export const db = drizzle(queryClient, { schema })
