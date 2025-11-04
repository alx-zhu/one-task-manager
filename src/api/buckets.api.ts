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

// Storage key for localStorage
const BUCKETS_STORAGE_KEY = "one-task-manager:buckets";

/**
 * Initialize localStorage with mock data if empty
 */
const initializeStorage = (): void => {
  if (!localStorage.getItem(BUCKETS_STORAGE_KEY)) {
    localStorage.setItem(BUCKETS_STORAGE_KEY, JSON.stringify(mockBuckets));
  }
};

/**
 * Get buckets from storage
 */
const getBucketsFromStorage = (): Bucket[] => {
  initializeStorage();
  const stored = localStorage.getItem(BUCKETS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save buckets to storage
 */
const saveBucketsToStorage = (buckets: Bucket[]): void => {
  localStorage.setItem(BUCKETS_STORAGE_KEY, JSON.stringify(buckets));
};

/**
 * Fetch all buckets
 */
export const fetchBuckets = async (): Promise<Bucket[]> => {
  const buckets = getBucketsFromStorage();
  return simulateApiCall(buckets);
};

/**
 * Create a new bucket
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('buckets')
 *   .insert([newBucket])
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const createBucket = async (
  newBucket: Omit<Bucket, "id" | "createdAt" | "updatedAt" | "tasks">
): Promise<Bucket> => {
  const buckets = getBucketsFromStorage();

  // Generate ID (in production, DB generates this)
  const id = `bucket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const bucket: Bucket = {
    ...newBucket,
    id,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updatedBuckets = [...buckets, bucket];
  saveBucketsToStorage(updatedBuckets);

  return simulateApiCall(bucket);
};

/**
 * Update an existing bucket
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('buckets')
 *   .update(updatedBucket)
 *   .eq('id', bucketId)
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const updateBucket = async (
  bucketId: string,
  updates: Partial<Bucket>
): Promise<Bucket> => {
  const buckets = getBucketsFromStorage();

  const updatedBuckets = buckets.map((bucket) => {
    if (bucket.id === bucketId) {
      return { ...bucket, ...updates, updatedAt: new Date() };
    }
    return bucket;
  });

  saveBucketsToStorage(updatedBuckets);

  const updatedBucket = updatedBuckets.find((b) => b.id === bucketId);
  if (!updatedBucket) throw new Error(`Bucket ${bucketId} not found`);

  return simulateApiCall(updatedBucket);
};

export const bulkUpdateBuckets = async (
  updates: Partial<Bucket>[]
): Promise<Bucket[]> => {
  const buckets = getBucketsFromStorage();

  const updateMap = new Map(updates.map((u) => [u.id, u]));

  const updatedBuckets = buckets.map((bucket) => {
    const update = updateMap.get(bucket.id);
    return update ? { ...bucket, ...update, updatedAt: new Date() } : bucket;
  });

  console.log("bulkUpdateBuckets - updatedBuckets:", updatedBuckets);

  saveBucketsToStorage(updatedBuckets);

  return simulateApiCall(updatedBuckets.filter((b) => updateMap.has(b.id!)));
};

/**
 * Delete a bucket
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('buckets')
 *   .delete()
 *   .eq('id', bucketId);
 * if (error) throw error;
 * ```
 */
export const deleteBucket = async (bucketId: string): Promise<void> => {
  const buckets = getBucketsFromStorage();
  const updatedBuckets = buckets.filter((bucket) => bucket.id !== bucketId);
  saveBucketsToStorage(updatedBuckets);

  return simulateApiCall(undefined);
};
