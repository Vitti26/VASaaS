import { db } from "@/modules/shared/infrastructure/db";

/**
 * Persisted sliding window rate limiter for VASaaS security protection.
 * Supports rate limiting by IP, Tenant, and active booking quotas.
 */

/**
 * Resets all stored rate limit windows (useful for unit tests).
 */
export async function resetRateLimitStore(): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    await db.rateLimitAttempt.deleteMany();
  }
}

/**
 * Evaluates whether a request identified by `key` is allowed within the rate limit parameters.
 * @param key Identifier (e.g. IP address, tenant slug, phone number)
 * @param maxRequests Maximum allowed requests within the time window
 * @param windowMs Time window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  const now = new Date();

  const attemptsCount = await db.rateLimitAttempt.count({
    where: {
      key,
      timestamp: {
        gte: windowStart,
      },
    },
  });

  if (attemptsCount >= maxRequests) {
    const oldestAttempt = await db.rateLimitAttempt.findFirst({
      where: { key, timestamp: { gte: windowStart } },
      orderBy: { timestamp: "asc" },
    });

    const resetMs = oldestAttempt ? oldestAttempt.timestamp.getTime() + windowMs - now.getTime() : windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  await db.rateLimitAttempt.create({
    data: { key, timestamp: now },
  });

  return {
    allowed: true,
    remaining: maxRequests - (attemptsCount + 1),
    resetMs: windowMs,
  };
}

/**
 * Helper to limit public booking attempts by client IP address.
 * Standard rule: Max 5 booking attempts per minute per IP.
 */
export async function checkIpBookingRateLimit(ipAddress: string): Promise<boolean> {
  const key = `ip_booking:${ipAddress}`;
  const res = await checkRateLimit(key, 5, 60 * 1000);
  return res.allowed;
}

/**
 * Helper to limit public booking attempts for a specific tenant.
 * Standard rule: Max 30 booking attempts per minute per tenant.
 */
export async function checkTenantBookingRateLimit(tenantSlug: string): Promise<boolean> {
  const key = `tenant_booking:${tenantSlug}`;
  const res = await checkRateLimit(key, 30, 60 * 1000);
  return res.allowed;
}

/**
 * Checks if a customer phone number has exceeded maximum pending/active bookings.
 * Standard rule: Max 3 pending/active bookings allowed simultaneously per phone number.
 */
export function checkPhoneBookingLimit(
  activeBookingsForPhoneCount: number,
  maxAllowed: number = 3
): boolean {
  return activeBookingsForPhoneCount < maxAllowed;
}
