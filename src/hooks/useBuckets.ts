/**
 * TanStack Query hooks for bucket data fetching
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bucketsApi from "@/api/buckets.api";
import * as tasksApi from "@/api/tasks.api";
import { hydrateBucketsWithTasks } from "@/lib/utils";
import {
  canUpdateBucketLimit,
  canDeleteBucket,
  findTargetBucketWithCapacity,
} from "@/lib/bucketValidations";
import { useMemo } from "react";
import { useTasks, getTasksFromCache, taskKeys } from "./useTasks";
import type { Bucket } from "@/types/task";

// Query keys for cache management
export const bucketKeys = {
  all: ["buckets"] as const,
  lists: () => [...bucketKeys.all, "list"] as const,
};

/**
 * Fetch all buckets
 */
export const useBuckets = () => {
  return useQuery({
    queryKey: bucketKeys.lists(),
    queryFn: bucketsApi.fetchBuckets,
    staleTime: 1000 * 60 * 10, // 10 minutes (buckets change less frequently)
  });
};

/**
 * Get buckets hydrated with active tasks only
 */
export const useHydratedBuckets = () => {
  const { data: buckets = [], isLoading: bucketsLoading } = useBuckets();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();

  const hydratedBuckets = useMemo(
    () => hydrateBucketsWithTasks(buckets, tasks),
    [buckets, tasks]
  );

  return {
    data: hydratedBuckets,
    isLoading: bucketsLoading || tasksLoading,
  };
};

export const useCreateBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bucketsApi.createBucket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
    },
  });
};

export const useUpdateBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bucketId,
      updates,
    }: {
      bucketId: string;
      updates: Partial<Bucket>;
    }) => {
      // Validation: Validate limit changes
      if (updates.limit !== undefined) {
        const buckets =
          queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];

        const validation = canUpdateBucketLimit(
          bucketId,
          updates.limit,
          buckets
        );
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
      }

      return bucketsApi.updateBucket(bucketId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
    },
    onError: (error) => {
      // Display error to user (ready for toast notification)
      console.error("Failed to update bucket:", error);
      // TODO: Replace with toast notification
      alert(error instanceof Error ? error.message : "Failed to update bucket");
    },
  });
};

export const useBulkUpdateBuckets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bucketsApi.bulkUpdateBuckets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
    },
  });
};

/**
 * Delete a bucket with automatic task relocation
 * Reads fresh bucket and task data at mutation execution time
 */
export const useDeleteBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bucketId: string) => {
      // Get fresh data from cache at mutation time (not hook creation time)
      const buckets =
        queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];
      const tasks = getTasksFromCache(queryClient, false);

      // Hydrate buckets with tasks for accurate validation
      const hydratedBuckets = hydrateBucketsWithTasks(buckets, tasks);

      // Validate if bucket can be deleted (basic checks)
      const validation = canDeleteBucket(bucketId, hydratedBuckets);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Get tasks from the bucket being deleted
      const bucketToDelete = hydratedBuckets.find((b) => b.id === bucketId);
      const tasksToRelocate = bucketToDelete?.tasks || [];

      // If there are tasks to relocate, find a bucket with capacity
      if (tasksToRelocate.length > 0) {
        // Use the helper to find a bucket that can accommodate all tasks
        const { bucketId: targetBucketId, orderInBucket: startOrder } =
          findTargetBucketWithCapacity(
            tasksToRelocate.length,
            hydratedBuckets,
            undefined, // No preferred target
            [bucketId], // Exclude the bucket being deleted
            `Cannot delete bucket "${
              bucketToDelete?.name
            }". No other bucket has space for ${tasksToRelocate.length} task${
              tasksToRelocate.length > 1 ? "s" : ""
            }.`
          );

        // Move all tasks to the target bucket
        const taskUpdates = tasksToRelocate.map((task, index) => ({
          id: task.id,
          bucketId: targetBucketId,
          orderInBucket: startOrder + index,
        }));

        // Update all tasks first
        await tasksApi.bulkUpdateTasks(taskUpdates);
      }

      // Now delete the bucket
      return bucketsApi.deleteBucket(bucketId);
    },
    onSuccess: () => {
      // Invalidate both buckets and tasks to refresh the UI
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error) => {
      // Display error to user (ready for toast notification)
      console.error("Failed to delete bucket:", error);
      // TODO: Replace with toast notification
      alert(error instanceof Error ? error.message : "Failed to delete bucket");
    },
  });
};

export const useMoveBucket = () => {
  const queryClient = useQueryClient();
  const bulkUpdateBuckets = useBulkUpdateBuckets();

  return (bucketId: string, direction: "up" | "down") => {
    const buckets =
      queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];
    const sorted = [...buckets].sort((a, b) => a.order - b.order);

    const currentIndex = sorted.findIndex((b) => b.id === bucketId);
    if (currentIndex === -1) return;

    // Validation: Cannot move the first bucket (The ONE Thing)
    if (currentIndex === 0 || sorted[currentIndex].isOneThing) {
      console.warn("Cannot move The ONE Thing bucket");
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Additional check: Cannot swap with the first bucket
    if (targetIndex === 0 || sorted[targetIndex].isOneThing) {
      console.warn("Cannot move buckets past The ONE Thing bucket");
      return;
    }

    // Swap order values
    const updates = [
      { id: sorted[currentIndex].id, order: sorted[targetIndex].order },
      { id: sorted[targetIndex].id, order: sorted[currentIndex].order },
    ];

    // Optimistic update
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const optimisticBuckets = buckets.map((bucket) => {
      const update = updateMap.get(bucket.id);
      return update ? { ...bucket, ...update } : bucket;
    });

    queryClient.setQueryData(bucketKeys.lists(), optimisticBuckets);

    // Persist to backend
    bulkUpdateBuckets.mutate(updates);
  };
};
