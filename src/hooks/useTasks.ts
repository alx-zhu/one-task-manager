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
import type { Task, NewTask, EditedTask } from "@/types/task";
import * as tasksApi from "@/api/tasks.api";
import { useBuckets } from "./useBuckets";

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
 * Fetch all tasks
 */
export const useTasks = (isComplete: boolean = false) => {
  return useQuery({
    queryKey: [...taskKeys.lists(), { isComplete }],
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
    onMutate: async (newTask: NewTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      // Optimistically update
      if (previousTasks) {
        const optimisticTask: Task = {
          ...newTask,
          id: `temp-${Date.now()}`, // Temporary ID
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        queryClient.setQueryData<Task[]>(taskKeys.lists(), [
          ...previousTasks,
          optimisticTask,
        ]);
      }

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },
    onSuccess: () => {
      // Refetch to get the real data
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Update an existing task
 *
 * @param optimistic - If true, applies optimistic updates for immediate UI feedback.
 *                     If false, waits for server response to avoid conflicts with
 *                     drag & drop and other simultaneous operations.
 */
export const useUpdateTask = (optimistic: boolean = true) => {
  const queryClient = useQueryClient();

  const handleMutate = async ({
    taskId,
    updates,
  }: {
    taskId: string;
    updates: Partial<EditedTask>;
  }) => {
    await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

    const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

    if (previousTasks) {
      queryClient.setQueryData<Task[]>(
        taskKeys.lists(),
        previousTasks.map((task: Task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    }

    return { previousTasks };
  };

  const handleError = (
    _err: Error,
    _variables: {
      taskId: string;
      updates: Partial<EditedTask>;
    },
    context:
      | {
          previousTasks: Task[] | undefined;
        }
      | undefined
  ) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
    }
  };

  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<EditedTask>;
    }) => tasksApi.updateTask(taskId, updates),
    onMutate: optimistic ? handleMutate : undefined,
    onError: optimistic ? handleError : undefined,
    onSuccess: () => {
      // Always refetch to ensure consistency
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
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.filter((task: Task) => task.id !== taskId)
        );
      }

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },
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
  const { data: buckets = [] } = useBuckets();

  return useMutation({
    mutationFn: async (task: Task) => {
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];

      // Check if current bucket has capacity
      const currentBucket = buckets.find((b) => b.id === task.bucketId);
      const currentBucketTasks = tasks.filter(
        (t) => t.bucketId === task.bucketId
      );
      const hasCapacity =
        !currentBucket?.limit ||
        currentBucketTasks.length < currentBucket.limit;

      let targetBucketId = task.bucketId;

      // If current bucket is full, find first available bucket
      if (!hasCapacity) {
        const availableBucket = buckets.find((bucket) => {
          const bucketTaskCount = tasks.filter(
            (t) => t.bucketId === bucket.id
          ).length;
          return !bucket.limit || bucketTaskCount < bucket.limit;
        });

        if (availableBucket) {
          targetBucketId = availableBucket.id;
        } else {
          throw new Error("No available buckets with capacity for duplicate");
        }
      }

      const newTask: NewTask = {
        title: `${task.title} (copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        dueDate: task.dueDate,
        bucketId: targetBucketId,
        orderInBucket: tasks.filter((t) => t.bucketId === targetBucketId)
          .length,
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
  const { data: buckets = [] } = useBuckets();

  return useMutation({
    mutationFn: async (task: Task) => {
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];

      // Filter to only count incomplete tasks in buckets
      const incompleteTasks = tasks.filter((t) => t.status !== "completed");

      // Try to return task to its original bucket
      const originalBucket = buckets.find((b) => b.id === task.bucketId);
      const originalBucketTasks = incompleteTasks.filter(
        (t) => t.bucketId === task.bucketId
      );
      const hasCapacity =
        !originalBucket?.limit ||
        originalBucketTasks.length < originalBucket.limit;

      let targetBucketId = task.bucketId;
      let targetOrderInBucket = originalBucketTasks.length;

      // If original bucket is full, find first available bucket
      if (!hasCapacity) {
        console.warn(
          `Original bucket "${originalBucket?.name}" is at capacity. Finding alternative bucket...`
        );

        const availableBucket = buckets.find((bucket) => {
          const bucketTaskCount = incompleteTasks.filter(
            (t) => t.bucketId === bucket.id
          ).length;
          return !bucket.limit || bucketTaskCount < bucket.limit;
        });

        if (availableBucket) {
          targetBucketId = availableBucket.id;
          targetOrderInBucket = incompleteTasks.filter(
            (t) => t.bucketId === availableBucket.id
          ).length;
          console.warn(
            `Task will be moved to "${availableBucket.name}" bucket instead.`
          );
        } else {
          const error = new Error(
            "Cannot uncomplete task - all buckets are at capacity. Please free up space first."
          );
          console.error(error.message);
          throw error;
        }
      }

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
