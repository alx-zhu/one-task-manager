// hooks/useTaskDragOperations.ts
/**
 * Specialized hooks for drag & drop operations
 * These add business logic on top of the base mutations
 */

import { useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task } from "@/types/task";
import { useBulkUpdateTasks, taskKeys } from "./useTasks";

/**
 * Reorder tasks within the same bucket
 * Handles optimistic updates for smooth drag & drop
 */
export function useReorderTasksInBucket() {
  const queryClient = useQueryClient();
  const bulkUpdate = useBulkUpdateTasks();

  return (task: Task, overId: string) => {
    const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];

    const bucketId = task.bucketId;
    if (!bucketId) return;

    // Get tasks in this bucket, sorted by current order
    const bucketTasks = tasks
      .filter((t) => t.bucketId === bucketId)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    // Find indices
    const oldIndex = bucketTasks.findIndex((t) => t.id === task.id);
    const newIndex = bucketTasks.findIndex((t) => t.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Use arrayMove to reorder
    const reordered = arrayMove(bucketTasks, oldIndex, newIndex);

    // Update orderInBucket to match new positions
    const updates = reordered.map((task, index) => ({
      id: task.id,
      orderInBucket: index,
    }));

    // Update cache immediately (synchronously) for smooth UI
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const updatedTasks = tasks.map((task) => {
      const update = updateMap.get(task.id);
      return update ? { ...task, ...update } : task;
    });

    queryClient.setQueryData(taskKeys.lists(), updatedTasks);

    // Then trigger the async mutation in the background
    bulkUpdate.mutate(updates);
  };
}

/**
 * Move task between buckets with positioning
 * Handles optimistic updates for smooth drag & drop
 */
export function useMoveTaskToBucket() {
  const queryClient = useQueryClient();
  const bulkUpdate = useBulkUpdateTasks();

  return (task: Task, targetBucketId: string, targetTaskId?: string) => {
    const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];
    if (!task) return;

    // Get target bucket tasks (excluding dragged task, sorted by order)
    const targetBucketTasks = tasks
      .filter((t) => t.bucketId === targetBucketId && t.id !== task.id)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    // Create temp array with dragged task at end
    const tempArray = [
      ...targetBucketTasks,
      {
        ...task,
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

    const sourceBucketId = task.bucketId;

    // Update source bucket tasks (re-sequence after removal)
    const sourceBucketTasks = tasks
      .filter((t) => t.bucketId === sourceBucketId && t.id !== task.id)
      .sort((a, b) => a.orderInBucket - b.orderInBucket);

    const sourceUpdates = sourceBucketTasks.map((task, index) => ({
      id: task.id,
      orderInBucket: index,
    }));

    // Combine all updates
    const allUpdates = [...targetUpdates, ...sourceUpdates];

    // Update cache immediately (synchronously) for smooth UI
    const updateMap = new Map(allUpdates.map((u) => [u.id, u]));
    const updatedTasks = tasks.map((task) => {
      const update = updateMap.get(task.id);
      return update ? { ...task, ...update } : task;
    });

    queryClient.setQueryData(taskKeys.lists(), updatedTasks);

    // Then trigger the async mutation in the background
    bulkUpdate.mutate(allUpdates);
  };
}
