// prisma.config.ts — Prisma v7 configuration (connection URLs live here, NOT in schema.prisma)
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
    // DIRECT_URL bypasses PgBouncer for DDL migrations (Supabase requirement)
  },

  datasource: {
    // This URL is used by `prisma migrate` / `prisma db push`
    url: process.env["DIRECT_URL"]!,
  },
});
