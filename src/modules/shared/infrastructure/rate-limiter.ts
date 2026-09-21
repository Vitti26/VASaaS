/**
 * In-memory sliding window rate limiter for VASaaS security protection.
 * Supports rate limiting by IP, Tenant, and active booking quotas.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Resets all stored rate limit windows (useful for unit tests).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Evaluates whether a request identified by `key` is allowed within the rate limit parameters.
 * @param key Identifier (e.g. IP address, tenant slug, phone number)
 * @param maxRequests Maximum allowed requests within the time window
 * @param windowMs Time window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Remove timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = oldestTimestamp + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Helper to limit public booking attempts by client IP address.
 * Standard rule: Max 5 booking attempts per minute per IP.
 */
export function checkIpBookingRateLimit(ipAddress: string): boolean {
  const key = `ip_booking:${ipAddress}`;
  const res = checkRateLimit(key, 5, 60 * 1000);
  return res.allowed;
}

/**
 * Helper to limit public booking attempts for a specific tenant.
 * Standard rule: Max 30 booking attempts per minute per tenant.
 */
export function checkTenantBookingRateLimit(tenantSlug: string): boolean {
  const key = `tenant_booking:${tenantSlug}`;
  const res = checkRateLimit(key, 30, 60 * 1000);
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
