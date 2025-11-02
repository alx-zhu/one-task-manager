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
import type { Task, NewTask, EditedTask, TaskStatus } from "@/types/task";
import * as tasksApi from "@/api/tasks.api";

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
export const useTasks = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: tasksApi.fetchTasks,
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
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<EditedTask>;
    }) => tasksApi.updateTask(taskId, updates),
    onMutate: async ({
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
    },
    onError: (_err, _variables, context) => {
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
 */
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.bulkUpdateTasks,
    onMutate: async (updates: Partial<Task>[]) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.map((task) => {
            const update = updateMap.get(task.id);
            return update ? { ...task, ...update } : task;
          })
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Toggle task completion
 */
export const useToggleTaskCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      currentStatus,
    }: {
      taskId: string;
      currentStatus: TaskStatus;
    }) => tasksApi.toggleTaskCompletion(taskId, currentStatus),
    onMutate: async ({ taskId, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());
      const newStatus =
        currentStatus === "completed" ? "not-started" : "completed";

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.map((task: Task) =>
            task.id === taskId
              ? { ...task, status: newStatus as TaskStatus }
              : task
          )
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },
  });
};
