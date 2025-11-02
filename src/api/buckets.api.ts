/**
 * Bucket API Operations
 *
 * For now, buckets are read-only from mock data.
 * Later, this will support CRUD operations when you add bucket management.
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('buckets')
 *   .select('*')
 *   .order('order', { ascending: true });
 * ```
 */

import type { Bucket } from "@/types/task";
import { simulateApiCall } from "./client";
import { mockBuckets } from "@/data/mockData";

/**
 * Fetch all buckets
 */
export const fetchBuckets = async (): Promise<Bucket[]> => {
  return simulateApiCall(mockBuckets);
};

/**
 * Future: Create bucket
 * export const createBucket = async (bucket: NewBucket): Promise<Bucket> => { ... }
 */

/**
 * Future: Update bucket
 * export const updateBucket = async (id: string, updates: Partial<Bucket>): Promise<Bucket> => { ... }
 */

/**
 * Future: Delete bucket
 * export const deleteBucket = async (id: string): Promise<void> => { ... }
 */
