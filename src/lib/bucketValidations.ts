/**
 * Bucket validation helpers
 * Centralized validation logic for bucket operations
 */

import type { Bucket } from "@/types/task";

export interface BucketValidationError {
  isValid: false;
  message: string;
}

export interface BucketValidationSuccess {
  isValid: true;
}

export type BucketValidationResult =
  | BucketValidationSuccess
  | BucketValidationError;

/**
 * Validates if a bucket can be deleted
 *
 * Rules:
 * - Cannot delete "The ONE Thing" bucket (isOneThing: true)
 * - Cannot delete the last bucket with no limit
 */
export const canDeleteBucket = (
  bucketId: string,
  allBuckets: Bucket[]
): BucketValidationResult => {
  const bucketToDelete = allBuckets.find((b) => b.id === bucketId);

  if (!bucketToDelete) {
    return {
      isValid: false,
      message: "Bucket not found",
    };
  }

  // Rule 1: Cannot delete "The ONE Thing" bucket
  if (bucketToDelete.isOneThing) {
    return {
      isValid: false,
      message: 'Cannot delete "The ONE Thing" bucket',
    };
  }

  // Rule 2: Cannot delete the last unlimited bucket
  if (bucketToDelete.limit === undefined) {
    const unlimitedBuckets = allBuckets.filter((b) => b.limit === undefined);

    if (unlimitedBuckets.length === 1) {
      return {
        isValid: false,
        message:
          "Cannot delete this bucket. At least one bucket must have no limit.",
      };
    }
  }

  return { isValid: true };
};

/**
 * Validates if a bucket limit can be updated
 *
 * Rules:
 * - "The ONE Thing" bucket must always have limit of 1
 * - At least one bucket must have no limit
 */
export const canUpdateBucketLimit = (
  bucketId: string,
  newLimit: number | undefined,
  allBuckets: Bucket[]
): BucketValidationResult => {
  const bucket = allBuckets.find((b) => b.id === bucketId);

  if (!bucket) {
    return {
      isValid: false,
      message: "Bucket not found",
    };
  }

  // Rule 1: The ONE Thing bucket must have limit of 1
  if (bucket.isOneThing && newLimit !== 1) {
    return {
      isValid: false,
      message: "The ONE Thing bucket must have a limit of 1",
    };
  }

  // Rule 2: Cannot remove limit if this is the last unlimited bucket
  if (bucket.limit === undefined && newLimit !== undefined) {
    const otherUnlimitedBuckets = allBuckets.filter(
      (b) => b.id !== bucketId && b.limit === undefined
    );

    if (otherUnlimitedBuckets.length === 0) {
      return {
        isValid: false,
        message:
          "Cannot set a limit on this bucket. At least one bucket must have no limit.",
      };
    }
  }

  return { isValid: true };
};

/**
 * Find a bucket with available capacity for tasks, with optional preferred target
 *
 * Simple algorithm:
 * 1. If targetBucketId is provided and has capacity, use it
 * 2. Otherwise, find the first bucket (by order) with capacity
 * 3. Optionally exclude buckets from consideration
 *
 * @param taskCount - Number of tasks that need space
 * @param allBuckets - All buckets in the system (should include hydrated tasks)
 * @param targetBucketId - Optional preferred bucket to try first
 * @param excludeBucketIds - Optional bucket IDs to exclude from search (e.g., buckets being deleted)
 * @param errorMessage - Custom error message if no bucket has capacity
 * @returns Object containing the bucket ID, order, and whether it was relocated
 * @throws Error if no bucket has capacity for the tasks
 */
export const findTargetBucketWithCapacity = (
  taskCount: number,
  allBuckets: Bucket[],
  targetBucketId?: string,
  excludeBucketIds?: string[],
  errorMessage?: string
): {
  bucketId: string;
  orderInBucket: number;
  relocated: boolean;
  targetBucket: Bucket;
} => {
  const excludeSet = new Set(excludeBucketIds || []);

  // Helper to check if a bucket has capacity
  const hasCapacity = (bucket: Bucket) => {
    const currentTaskCount = bucket.tasks?.length || 0;
    return !bucket.limit || currentTaskCount + taskCount <= bucket.limit;
  };

  // Try the target bucket first if specified and not excluded
  if (targetBucketId && !excludeSet.has(targetBucketId)) {
    const targetBucket = allBuckets.find((b) => b.id === targetBucketId);

    if (targetBucket && hasCapacity(targetBucket)) {
      return {
        bucketId: targetBucketId,
        orderInBucket: targetBucket.tasks?.length || 0,
        relocated: false,
        targetBucket,
      };
    }
  }

  // Find first available bucket (excluding specified buckets)
  const availableBucket = allBuckets
    .filter((b) => !excludeSet.has(b.id))
    .sort((a, b) => a.order - b.order)
    .find(hasCapacity);

  if (availableBucket) {
    return {
      bucketId: availableBucket.id,
      orderInBucket: availableBucket.tasks?.length || 0,
      relocated:
        targetBucketId !== undefined && targetBucketId !== availableBucket.id,
      targetBucket: availableBucket,
    };
  }

  // No bucket has capacity
  const error = new Error(
    errorMessage ||
      `Cannot place ${taskCount} task${
        taskCount > 1 ? "s" : ""
      } - all buckets are at capacity. Please free up space first.`
  );
  console.error(error.message);
  throw error;
};
