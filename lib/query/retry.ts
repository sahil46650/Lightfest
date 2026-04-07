/**
 * TanStack Query Retry Configuration
 *
 * Provides intelligent retry logic that:
 * - Retries on transient network errors
 * - Does NOT retry on client errors (4xx)
 * - Uses exponential backoff
 */

/**
 * Check if an error is retryable.
 * Returns false for client errors (4xx) which indicate bad input.
 * Returns true for server errors (5xx) and network errors.
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors (no response)
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  // Check for HTTP status codes in various error shapes
  const status = getErrorStatus(error);

  if (status === null) {
    // Unknown error type - assume retryable
    return true;
  }

  // Don't retry client errors (400-499) - these won't succeed with retry
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry server errors (500+) and other status codes
  return status >= 500;
}

/**
 * Extract HTTP status code from various error shapes.
 */
function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  // Standard fetch/axios response
  if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
    return (error as { status: number }).status;
  }

  // Nested response object
  if ('response' in error) {
    const response = (error as { response: unknown }).response;
    if (response && typeof response === 'object' && 'status' in response) {
      return (response as { status: number }).status ?? null;
    }
  }

  // API error with statusCode
  if ('statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number') {
    return (error as { statusCode: number }).statusCode;
  }

  return null;
}

/**
 * Default retry function for queries.
 * Retries up to 3 times for transient errors.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const maxRetries = 3;

  if (failureCount >= maxRetries) {
    return false;
  }

  return isRetryableError(error);
}

/**
 * Exponential backoff with jitter for retry delays.
 * Base delay of 1s, with randomization to prevent thundering herd.
 */
export function getRetryDelay(attemptIndex: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const delay = Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);

  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);

  return Math.round(delay + jitter);
}

/**
 * Default retry function for mutations.
 * More conservative - only retries once for network errors.
 */
export function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  const maxRetries = 1;

  if (failureCount >= maxRetries) {
    return false;
  }

  // Only retry on clear network failures for mutations
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  return false;
}

/**
 * Pre-configured query retry options.
 */
export const queryRetryOptions = {
  retry: shouldRetryQuery,
  retryDelay: getRetryDelay,
} as const;

/**
 * Pre-configured mutation retry options.
 */
export const mutationRetryOptions = {
  retry: shouldRetryMutation,
  retryDelay: getRetryDelay,
} as const;
