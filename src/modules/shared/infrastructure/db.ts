import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Executes a database query with a fast timeout fallback.
 * If PostgreSQL is offline or non-responsive, returns fallbackValue instantly (within timeoutMs).
 */
export async function withDbFallback<T>(
  queryFn: () => Promise<T>,
  fallbackValue: T,
  timeoutMs: number = 300
): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallbackValue), timeoutMs);
  });

  try {
    const result = await Promise.race([queryFn(), timeoutPromise]);
    return result ?? fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}
