import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "PrismaClient cannot be initialized without a database connection."
    );
  }

  // PrismaPg can accept either a Pool instance or connectionString
  // Using Pool for better connection management
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  const prisma = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
  
  return prisma;
}

// Lazy initialization - only create when accessed at runtime
// This prevents build-time errors when DATABASE_URL might not be available
let prismaInstance: PrismaClient | undefined;

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // During build time or when DATABASE_URL is not available,
    // return a stub that prevents actual database operations
    // Check both DATABASE_URL and NEXT_PHASE to detect build context
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL || isBuildTime) {
      // Create a stub object that matches PrismaClient structure
      // This prevents initialization errors during build while preserving types
      return new Proxy({} as Record<string, unknown>, {
        get: () => {
          // Return a function that rejects/throws when called
          return () => {
            return Promise.reject(
              new Error(
                `PrismaClient cannot be used during build time or without DATABASE_URL. ` +
                `Set DATABASE_URL in your environment or .env.production file.`
              )
            );
          };
        },
      });
    }
    
    // At runtime with DATABASE_URL available, initialize and return the real client
    if (!prismaInstance) {
      prismaInstance = getPrismaClient();
    }
    const value = prismaInstance[prop as keyof PrismaClient];
    if (typeof value === 'function') {
      return value.bind(prismaInstance);
    }
    return value;
  },
});

export default prisma;