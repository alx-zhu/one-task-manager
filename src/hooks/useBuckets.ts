/**
 * TanStack Query hooks for bucket data fetching
 */

import { useQuery } from "@tanstack/react-query";
import * as bucketsApi from "@/api/buckets.api";

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
