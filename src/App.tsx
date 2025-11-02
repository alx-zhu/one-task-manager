/**
 * Refactored App.tsx using TanStack Query hooks
 *
 * This version:
 * - Uses React Query for all data fetching
 * - No prop drilling - operations are handled at the hook level
 * - Cleaner, more maintainable code
 * - Ready for Supabase migration
 */

import { useState, useMemo } from "react";
import { BucketSection } from "@/components/table";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TaskRowPreview } from "./components/table/row/TaskPreviewRow";
import type { Task } from "./types/task";
import { hydrateBucketsWithTasks } from "./lib/utils";
import type { DragDataType } from "./types/dnd";
import { useTasks } from "./hooks/useTasks";
import { useBuckets } from "./hooks/useBuckets";
import { useTaskOperations } from "./hooks/useTaskOperations";

function App() {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Fetch data using React Query
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: buckets = [], isLoading: bucketsLoading } = useBuckets();

  // Get task operations (all the CRUD functions)
  const taskOps = useTaskOperations();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const hydratedBuckets = useMemo(
    () => hydrateBucketsWithTasks(buckets, tasks),
    [buckets, tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task: Task = event.active.data.current?.task;
    setDraggedTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    if (!over || !draggedTask) {
      setDraggedTask(null);
      return;
    }

    const overData = over.data.current as DragDataType;

    // Case 1: Dropped on another task
    if (overData?.type === "task") {
      const targetTask = overData.task;
      const sourceBucketId = draggedTask.bucketId;
      const targetBucketId = targetTask.bucketId;

      if (sourceBucketId === targetBucketId) {
        taskOps.reorderTasksInBucket(
          sourceBucketId,
          draggedTask.id,
          targetTask.id
        );
      } else {
        taskOps.moveTaskBetweenBuckets(
          sourceBucketId,
          targetBucketId,
          draggedTask.id,
          targetTask.id
        );
      }
    }

    // Case 2: Dropped on bucket (add to end)
    if (overData?.type === "bucket") {
      const targetBucket = overData.bucket;
      const sourceBucketId = draggedTask.bucketId;
      const targetBucketId = targetBucket.id;

      // Check bucket limit before moving
      const targetBucketTaskCount = tasks.filter(
        (t) => t.bucketId === targetBucketId
      ).length;

      if (targetBucket.limit && targetBucketTaskCount >= targetBucket.limit) {
        console.warn(
          `Cannot move: Bucket "${targetBucket.name}" is at capacity`
        );
        setDraggedTask(null);
        return;
      }

      if (sourceBucketId !== targetBucketId) {
        taskOps.moveTaskBetweenBuckets(
          sourceBucketId,
          targetBucketId,
          draggedTask.id
        );
      }
    }

    setDraggedTask(null);
  };

  const handleDragCancel = () => {
    setDraggedTask(null);
  };

  // Show loading state
  if (tasksLoading || bucketsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Task Pipeline
          </h1>
          <p className="text-gray-500 text-[0.95rem]">
            Focus on your ONE thing by prioritizing what matters most
          </p>
        </header>

        {/* Pipeline Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-medium text-gray-900">
            Priority Buckets
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-md font-medium transition-colors hover:bg-gray-50 hover:border-gray-300">
              + Add Column
            </button>
            <button className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-md font-medium transition-colors hover:bg-gray-50 hover:border-gray-300">
              Customize Buckets
            </button>
            <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md font-medium transition-colors hover:bg-gray-700">
              + Add Task
            </button>
          </div>
        </div>

        {/* Buckets */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          collisionDetection={pointerWithin}
        >
          <div>
            {hydratedBuckets.map((bucket) => (
              <BucketSection
                key={bucket.id}
                bucket={bucket}
                allBuckets={hydratedBuckets}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {draggedTask ? (
              <div className="scale-105 shadow-2xl">
                <TaskRowPreview task={draggedTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
