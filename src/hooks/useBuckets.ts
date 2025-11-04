/**
 * TanStack Query hooks for bucket data fetching
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bucketsApi from "@/api/buckets.api";
import { hydrateBucketsWithTasks } from "@/lib/utils";
import { useMemo } from "react";
import { useTasks } from "./useTasks";
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
    }) => bucketsApi.updateBucket(bucketId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
    },
  });
};

export const useBulkUpdateBuckets = () => {
  const queryClient = useQueryClient();
  console.log("useBulkUpdateBuckets called");
  return useMutation({
    mutationFn: bucketsApi.bulkUpdateBuckets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
    },
  });
};

export const useDeleteBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bucketId: string) => bucketsApi.deleteBucket(bucketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
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

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Swap order values
    const updates = [
      { id: sorted[currentIndex].id, order: sorted[targetIndex].order },
      { id: sorted[targetIndex].id, order: sorted[currentIndex].order },
    ];

    console.log("useMoveBucket - updates:", updates);

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
