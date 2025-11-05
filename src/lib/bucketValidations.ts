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
 * Find the first bucket with available space for task relocation
 *
 * Algorithm:
 * 1. Get all buckets except the source bucket
 * 2. Calculate available space for each bucket (limit - current task count)
 * 3. Return the first bucket with enough space for the specified number of tasks
 *
 * @param sourceBucketId - The ID of the bucket to exclude from search
 * @param taskCount - Number of tasks that need space
 * @param allBuckets - All buckets in the system (should include hydrated tasks)
 * @returns The first bucket with enough space, or null if none available
 */
export const findFirstBucketWithSpace = (
  sourceBucketId: string,
  taskCount: number,
  allBuckets: Bucket[]
): Bucket | null => {
  if (taskCount === 0) {
    return null;
  }

  // Get all other buckets (sorted by order to maintain consistent behavior)
  const otherBuckets = allBuckets
    .filter((b) => b.id !== sourceBucketId)
    .sort((a, b) => a.order - b.order);

  // Find first bucket with enough space
  for (const bucket of otherBuckets) {
    const currentTaskCount = bucket.tasks?.length || 0;
    const availableSpace = bucket.limit
      ? bucket.limit - currentTaskCount
      : Infinity;

    if (availableSpace >= taskCount) {
      return bucket;
    }
  }

  return null;
};

/**
 * Validates if a bucket can be deleted with task relocation
 *
 * Rules:
 * - Cannot delete "The ONE Thing" bucket (isOneThing: true)
 * - Cannot delete the last bucket with no limit
 * - If bucket has tasks, there must be another bucket with enough space
 *
 * @param bucketId - The ID of the bucket to delete
 * @param allBuckets - All buckets in the system (should include hydrated tasks)
 * @returns Validation result with optional target bucket for relocation
 */
export const canDeleteBucketWithRelocation = (
  bucketId: string,
  allBuckets: Bucket[]
): BucketValidationResult & { targetBucketId?: string } => {
  // First run standard deletion checks
  const basicValidation = canDeleteBucket(bucketId, allBuckets);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Check if bucket has tasks that need relocation
  const bucketToDelete = allBuckets.find((b) => b.id === bucketId);
  if (!bucketToDelete) {
    return {
      isValid: false,
      message: "Bucket not found",
    };
  }

  const taskCount = bucketToDelete.tasks?.length || 0;

  // If no tasks, deletion is straightforward
  if (taskCount === 0) {
    return { isValid: true };
  }

  // Find a bucket to relocate tasks to
  const targetBucket = findFirstBucketWithSpace(
    bucketId,
    taskCount,
    allBuckets
  );

  if (!targetBucket) {
    return {
      isValid: false,
      message: `Cannot delete bucket. No other bucket has space for ${taskCount} task${
        taskCount > 1 ? "s" : ""
      }.`,
    };
  }

  return {
    isValid: true,
    targetBucketId: targetBucket.id,
  };
};
