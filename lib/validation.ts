import crypto from "crypto";

// Email validation using stricter regex
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 254;
}

// UUID validation (v4 format)
export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Timing-safe password comparison to prevent timing attacks
export function verifyPassword(
  provided: string,
  expected?: string
): boolean {
  if (!expected || !provided) return false;

  try {
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);

    // Ensure same length before comparison
    if (providedBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}

// Sanitize article text to prevent XSS
export function sanitizeText(text: string, maxLength?: number): string {
  let sanitized = text.trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// Validate article body length
export function validateArticleBody(body: string): {
  valid: boolean;
  error?: string;
} {
  const minLength = 10;
  const maxLength = 50000;

  if (!body || body.trim().length < minLength) {
    return {
      valid: false,
      error: `Article body must be at least ${minLength} characters`,
    };
  }

  if (body.length > maxLength) {
    return {
      valid: false,
      error: `Article body must be less than ${maxLength} characters`,
    };
  }

  return { valid: true };
}

// Type guard for checking if value is a string
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Type guard for checking if value is an array
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Type guard for checking if value is a record
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
