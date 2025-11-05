/**
 * TanStack Query hooks for task data fetching
 *
 * These hooks provide:
 * - Automatic caching
 * - Background refetching
 * - Loading and error states
 * - Optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, NewTask, EditedTask, Bucket } from "@/types/task";
import * as tasksApi from "@/api/tasks.api";
import { bucketKeys } from "./useBuckets";
import { hydrateBucketsWithTasks } from "@/lib/utils";
import { findTargetBucketWithCapacity } from "@/lib/bucketValidations";

// Query keys for cache management
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Helper to safely get tasks from query cache with correct key
 *
 * @param queryClient - The TanStack Query client
 * @param isComplete - Whether to fetch completed or active tasks
 * @returns Array of tasks or empty array if not found
 */
export const getTasksFromCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  isComplete: boolean
): Task[] => {
  return queryClient.getQueryData<Task[]>(taskKeys.list({ isComplete })) || [];
};

/**
 * Fetch all tasks
 */
export const useTasks = (isComplete: boolean = false) => {
  return useQuery({
    queryKey: taskKeys.list({ isComplete }),
    queryFn: () => tasksApi.fetchTasks(isComplete),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Create a new task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      // Refetch to get the real data
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Update an existing task
 *
 * Optimistic updates are disabled to avoid complexity with managing state
 * across multiple query keys (completed vs active tasks).
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<EditedTask>;
    }) => {
      // Check if uncompleting a task via status update
      if (updates.status && updates.status !== "completed") {
        const completedTasks = getTasksFromCache(queryClient, true);
        const completedTask = completedTasks.find((t) => t.id === taskId);

        if (completedTask) {
          // Task is being uncompleted - find bucket with capacity
          const buckets =
            queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];
          const activeTasks = getTasksFromCache(queryClient, false);
          const hydratedBuckets = hydrateBucketsWithTasks(buckets, activeTasks);

          const {
            bucketId: targetBucketId,
            orderInBucket: targetOrderInBucket,
          } = findTargetBucketWithCapacity(
            1,
            hydratedBuckets,
            completedTask.bucketId,
            [],
            "Cannot uncomplete task - all buckets are at capacity. Please free up space first."
          );

          return tasksApi.updateTask(taskId, {
            ...updates,
            bucketId: targetBucketId,
            orderInBucket: targetOrderInBucket,
          });
        }
      }

      // If a task is not being uncompleted, just update normally
      return tasksApi.updateTask(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Bulk update tasks (for drag & drop reordering)
 *
 * IMPORTANT: Uses onSuccess instead of optimistic updates to avoid
 * flickering/bouncing during drag operations
 */
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.bulkUpdateTasks,
    // NO optimistic updates - let drag & drop handle the UI
    // React Query will update after the operation completes
    onSuccess: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook for duplicating tasks with bucket capacity logic
 */
export function useDuplicateTask() {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();

  return useMutation({
    mutationFn: async (task: Task) => {
      // Get fresh data from cache
      const buckets =
        queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];
      const tasks = getTasksFromCache(queryClient, false);

      // Hydrate buckets with tasks for accurate validation
      const hydratedBuckets = hydrateBucketsWithTasks(buckets, tasks);

      // Use helper to find target bucket with capacity
      const { bucketId: targetBucketId, orderInBucket: targetOrderInBucket } =
        findTargetBucketWithCapacity(
          1, // Need space for 1 task
          hydratedBuckets,
          task.bucketId, // Try current bucket first
          [], // No exclusions
          "No available buckets with capacity for duplicate"
        );

      const newTask: NewTask = {
        title: `${task.title} (copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        dueDate: task.dueDate,
        bucketId: targetBucketId,
        orderInBucket: targetOrderInBucket,
        userId: task.userId,
      };

      return createTask.mutateAsync(newTask);
    },
    onSuccess: () => {
      // Refetch to ensure UI is in sync
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Hook for uncompleting tasks with bucket capacity logic
 */
export function useUncompleteTask() {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async (task: Task) => {
      // Get fresh data from cache
      const buckets =
        queryClient.getQueryData<Bucket[]>(bucketKeys.lists()) || [];
      const tasks = getTasksFromCache(queryClient, false);

      // Hydrate buckets with tasks for accurate validation
      const hydratedBuckets = hydrateBucketsWithTasks(buckets, tasks);

      // Use helper to find target bucket with capacity
      const { bucketId: targetBucketId, orderInBucket: targetOrderInBucket } =
        findTargetBucketWithCapacity(
          1, // Need space for 1 task
          hydratedBuckets,
          task.bucketId, // Try original bucket first
          [], // No exclusions
          "Cannot uncomplete task - all buckets are at capacity. Please free up space first."
        );

      // Uncomplete the task
      return updateTask.mutateAsync({
        taskId: task.id,
        updates: {
          status: "in-progress",
          bucketId: targetBucketId,
          orderInBucket: targetOrderInBucket,
        },
      });
    },
    onSuccess: () => {
      // Refetch to ensure UI is in sync
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
