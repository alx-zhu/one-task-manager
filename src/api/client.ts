/**
 * API Client Configuration
 *
 * This file will eventually contain:
 * - Supabase client initialization
 * - Auth headers
 * - Error handling
 * - Request/response interceptors
 */

// Simulated network delay for realistic behavior
const MOCK_DELAY = 300;

/**
 * Simulates async API call with delay
 * Replace this with actual fetch/Supabase calls later
 */
export const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    resolve(data);
  });
};

/**
 * Simulates API error
 * Replace with proper error handling later
 */
export const simulateApiError = (message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), MOCK_DELAY);
  });
};

/**
 * Future Supabase client setup will look like:
 *
 * import { createClient } from '@supabase/supabase-js'
 *
 * export const supabase = createClient(
 *   process.env.VITE_SUPABASE_URL!,
 *   process.env.VITE_SUPABASE_ANON_KEY!
 * )
 */
