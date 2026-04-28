// Safe array-like access that returns undefined instead of accessing out of bounds
export function safeAt<T>(arr: ArrayLike<T> | null | undefined, index: number): T | undefined {
  if (!arr || index < 0 || index >= arr.length) {
    return undefined;
  }
  return arr[index];
}

// Safe JSON parsing with error handling
export function safeJsonParse<T>(str: unknown, defaultValue: T): T {
  if (typeof str !== "string") {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(str);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

// Type-safe response casting with optional validation
export function castResponse<T>(
  data: unknown,
  validator?: (data: unknown) => boolean
): T | null {
  if (validator && !validator(data)) {
    return null;
  }
  return data as T;
}

// Safe optional chaining for nested object access
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== "object") {
    return defaultValue;
  }

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return (current as T) || defaultValue;
}

// Safely execute async operations with timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Operation timeout")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}
