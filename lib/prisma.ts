import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

let prismaClient: PrismaClient | null = null

const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query"] : [],
    })
  } catch (error) {
    // During build time, Prisma might not be able to initialize
    console.warn("Could not initialize Prisma client:", error)
    return null
  }
}

if (!globalForPrisma.prisma) {
  prismaClient = createPrismaClient()
  if (prismaClient && process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient
  }
} else {
  prismaClient = globalForPrisma.prisma
}

export const prisma = prismaClient || new PrismaClient()

export default prisma
