// prisma.config.ts — Prisma v7 configuration (connection URLs live here, NOT in schema.prisma)
import * as dotenv from "dotenv";
// Load .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    // DIRECT_URL: bypasses PgBouncer pooler — required for db push & migrations
    // DATABASE_URL (with pgbouncer=true) is used by the app at runtime via lib/prisma.ts
    url: process.env["DIRECT_URL"]!,
  },
});
