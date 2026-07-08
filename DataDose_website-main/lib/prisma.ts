import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // Strip Prisma-CLI-only hints (pgbouncer=true) before passing to the pg driver
  const rawUrl = process.env.DATABASE_URL ?? ''
  const url = new URL(rawUrl)
  url.searchParams.delete('pgbouncer')
  const pool = new Pool({ connectionString: url.toString() })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
