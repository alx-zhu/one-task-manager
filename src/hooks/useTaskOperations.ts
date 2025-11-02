/**
 * High-level task operations that compose mutations
 * This is where complex business logic lives
 */

import { useQueryClient } from "@tanstack/react-query";
import type { Task, NewTask, Bucket } from "@/types/task";
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useToggleTaskCompletion,
  taskKeys,
} from "./useTasks";
import { arrayMove } from "@dnd-kit/sortable";

export const useTaskOperations = () => {
  const queryClient = useQueryClient();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const bulkUpdateMutation = useBulkUpdateTasks();
  const toggleCompletionMutation = useToggleTaskCompletion();

  /**
   * Get current tasks from cache
   */
  const getTasks = (): Task[] => {
    return queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];
  };

  /**
   * Create a new task
   */
  const createTask = async (newTask: NewTask) => {
    return createTaskMutation.mutateAsync(newTask);
  };

  /**
   * Update a task
   */
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    return updateTaskMutation.mutateAsync({ taskId, updates });
  };

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string) => {
    return deleteTaskMutation.mutateAsync(taskId);
  };

  /**
   * Duplicate a task
   */
  const duplicateTask = async (task: Task, buckets: Bucket[]) => {
    const tasks = getTasks();

    // Check if current bucket has capacity
    const currentBucket = buckets.find((b) => b.id === task.bucketId);
    const currentBucketTasks = tasks.filter(
      (t) => t.bucketId === task.bucketId
    );
    const hasCapacity =
      !currentBucket?.limit || currentBucketTasks.length < currentBucket.limit;

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
      orderInBucket: tasks.filter((t) => t.bucketId === targetBucketId).length,
      userId: task.userId, // Will come from auth context later
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return createTaskMutation.mutateAsync(newTask);
  };

  /**
   * Move task to a different bucket
   */
  const moveTaskToBucket = async (taskId: string, targetBucketId: string) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetBucketTasks = tasks.filter(
      (t) => t.bucketId === targetBucketId
    );
    const newOrder = targetBucketTasks.length;

    return updateTaskMutation.mutateAsync({
      taskId,
      updates: {
        id: taskId,
        bucketId: targetBucketId,
        orderInBucket: newOrder,
      },
    });
  };

  /**
   * Reorder tasks within the same bucket
   *
   * This is called during drag & drop, so we want to update
   * the cache synchronously to avoid bouncing
   */
  const reorderTasksInBucket = (
    bucketId: string,
    activeId: string,
    overId: string
  ) => {
    const tasks = getTasks();

    // Get tasks in this bucket, sorted by current order
    const bucketTasks = tasks
      .filter((t) => t.bucketId === bucketId)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    // Find indices
    const oldIndex = bucketTasks.findIndex((t) => t.id === activeId);
    const newIndex = bucketTasks.findIndex((t) => t.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Use arrayMove to reorder
    const reordered = arrayMove(bucketTasks, oldIndex, newIndex);

    // Update orderInBucket to match new positions
    const updates = reordered.map((task, index) => ({
      id: task.id,
      orderInBucket: index,
    }));

    // Update cache immediately (synchronously)
    const allTasks = getTasks();
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const updatedTasks = allTasks.map((task) => {
      const update = updateMap.get(task.id);
      return update ? { ...task, ...update } : task;
    });

    queryClient.setQueryData(taskKeys.lists(), updatedTasks);

    // Then trigger the async mutation in the background
    bulkUpdateMutation.mutate(updates);
  };

  /**
   * Move task between buckets with positioning
   */
  const moveTaskBetweenBuckets = async (
    sourceBucketId: string,
    targetBucketId: string,
    draggedTaskId: string,
    targetTaskId?: string
  ) => {
    const tasks = getTasks();
    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    if (!draggedTask) return;

    // Get target bucket tasks (excluding dragged task, sorted by order)
    const targetBucketTasks = tasks
      .filter((t) => t.bucketId === targetBucketId && t.id !== draggedTaskId)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    // Create temp array with dragged task at end
    const tempArray = [
      ...targetBucketTasks,
      {
        ...draggedTask,
        bucketId: targetBucketId,
        orderInBucket: targetBucketTasks.length,
      },
    ];

    // Find target position
    let targetIndex: number;
    if (targetTaskId) {
      targetIndex = tempArray.findIndex((t) => t.id === targetTaskId);
      if (targetIndex === -1) targetIndex = tempArray.length - 1;
    } else {
      targetIndex = tempArray.length - 1;
    }

    // Reorder
    const reorderedTarget = arrayMove(
      tempArray,
      tempArray.length - 1,
      targetIndex
    );

    // Update orderInBucket for target bucket
    const targetUpdates = reorderedTarget.map((task, index) => ({
      id: task.id,
      bucketId: targetBucketId,
      orderInBucket: index,
    }));

    // Update source bucket tasks (re-sequence after removal)
    const sourceBucketTasks = tasks
      .filter((t) => t.bucketId === sourceBucketId && t.id !== draggedTaskId)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    const sourceUpdates = sourceBucketTasks.map((task, index) => ({
      id: task.id,
      orderInBucket: index,
    }));

    // Combine all updates
    const allUpdates = [...targetUpdates, ...sourceUpdates];

    // Update cache immediately (synchronously)
    const allTasks = getTasks();
    const updateMap = new Map(allUpdates.map((u) => [u.id, u]));
    const updatedTasks = allTasks.map((task) => {
      const update = updateMap.get(task.id);
      return update ? { ...task, ...update } : task;
    });

    queryClient.setQueryData(taskKeys.lists(), updatedTasks);

    // Then trigger the async mutation in the background
    bulkUpdateMutation.mutate(allUpdates);
  };

  /**
   * Toggle task completion status
   */
  const toggleTaskCompletion = async (taskId: string) => {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    return toggleCompletionMutation.mutateAsync({
      taskId,
      currentStatus: task.status,
    });
  };

  return {
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    moveTaskToBucket,
    reorderTasksInBucket,
    moveTaskBetweenBuckets,
    toggleTaskCompletion,
    isLoading:
      createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      deleteTaskMutation.isPending ||
      bulkUpdateMutation.isPending ||
      toggleCompletionMutation.isPending,
  };
};
