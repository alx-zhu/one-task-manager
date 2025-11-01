import { useMemo, useState } from "react";
import { BucketSection } from "@/components/TaskTable";
import { mockBuckets, mockTasks } from "@/data/mockData";
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
import { TaskRowPreview } from "./components/TaskTable/TaskRow/TaskPreviewRow";
import type { Bucket, EditedTask, NewTask, Task } from "./types/task";
import { hydrateBucketsWithTasks } from "./lib/utils";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragDataType } from "./types/dnd";

function App() {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [buckets] = useState<Bucket[]>(mockBuckets);

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

  const canMoveTaskToBucket = (
    taskId: string,
    targetBucketId: string
  ): boolean => {
    const targetBucket = buckets.find((b) => b.id === targetBucketId);
    if (!targetBucket || !targetBucket.limit) return true;

    const currentTasksInBucket = tasks.filter(
      (t) => t.bucketId === targetBucketId
    );
    const taskAlreadyInBucket = currentTasksInBucket.some(
      (t) => t.id === taskId
    );

    if (taskAlreadyInBucket) return true;
    return currentTasksInBucket.length < targetBucket.limit;
  };

  const hydratedBuckets = useMemo(
    () => hydrateBucketsWithTasks(buckets, tasks),
    [buckets, tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task: Task = event.active.data.current?.task;
    setDraggedTask(task);
  };

  const reorderTasksInBucket = (
    bucketId: string,
    activeId: string,
    overId: string
  ) => {
    setTasks((prevTasks) => {
      // Get tasks in this bucket, sorted by current order
      const bucketTasks = prevTasks
        .filter((t) => t.bucketId === bucketId)
        .sort((a, b) => a.orderInBucket - b.orderInBucket);

      // Get tasks from other buckets (unchanged)
      const otherTasks = prevTasks.filter((t) => t.bucketId !== bucketId);

      // Find indices
      const oldIndex = bucketTasks.findIndex((t) => t.id === activeId);
      const newIndex = bucketTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prevTasks;

      // Use arrayMove to reorder
      const reordered = arrayMove(bucketTasks, oldIndex, newIndex);

      // Update orderInBucket to match new positions
      const updatedBucketTasks = reordered.map((task, index) => ({
        ...task,
        orderInBucket: index,
        updatedAt: new Date(),
      }));

      return [...otherTasks, ...updatedBucketTasks];
    });
  };

  const moveTaskToBucket = (
    sourceBucketId: string,
    targetBucketId: string,
    draggedTaskId: string,
    targetTaskId?: string
  ) => {
    if (!canMoveTaskToBucket(draggedTaskId, targetBucketId)) {
      console.warn("Cannot move: Target bucket is at capacity");
      return;
    }

    setTasks((prevTasks) => {
      const draggedTask = prevTasks.find((t) => t.id === draggedTaskId);
      if (!draggedTask) return prevTasks;

      // Get target bucket tasks (excluding dragged task, sorted by order)
      const targetBucketTasks = prevTasks
        .filter((t) => t.bucketId === targetBucketId && t.id !== draggedTaskId)
        .sort((a, b) => a.orderInBucket - b.orderInBucket);

      // Create a temporary array with the dragged task at the end
      const tempArray = [
        ...targetBucketTasks,
        {
          ...draggedTask,
          bucketId: targetBucketId,
          orderInBucket: targetBucketTasks.length,
        },
      ];

      // Find the target position
      let targetIndex: number;
      if (targetTaskId) {
        targetIndex = tempArray.findIndex((t) => t.id === targetTaskId);
        if (targetIndex === -1) targetIndex = tempArray.length - 1;
      } else {
        targetIndex = tempArray.length - 1; // Already at the end
      }

      // Use arrayMove to move from end to target position
      const reorderedTarget = arrayMove(
        tempArray,
        tempArray.length - 1,
        targetIndex
      );

      // Update orderInBucket for target bucket
      const updatedTargetTasks = reorderedTarget.map((task, index) => ({
        ...task,
        orderInBucket: index,
        updatedAt: new Date(),
      }));

      // Update source bucket tasks (re-sequence after removal)
      const sourceBucketTasks = prevTasks
        .filter((t) => t.bucketId === sourceBucketId && t.id !== draggedTaskId)
        .sort((a, b) => a.orderInBucket - b.orderInBucket)
        .map((task, index) => ({
          ...task,
          orderInBucket: index,
          updatedAt: new Date(),
        }));

      // Get tasks from other buckets (unchanged)
      const otherTasks = prevTasks.filter(
        (t) => t.bucketId !== sourceBucketId && t.bucketId !== targetBucketId
      );

      return [...otherTasks, ...sourceBucketTasks, ...updatedTargetTasks];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      setDraggedTask(null);
      return;
    }

    if (!draggedTask) {
      setDraggedTask(null);
      return;
    }

    const overData = over.data.current as DragDataType;

    // Case 1: Dropped on another task
    if (overData?.type === "task") {
      const targetTask = overData.task;

      const sourceBucketId = draggedTask.bucketId;
      const targetBucketId = targetTask.bucketId;

      console.log(
        `Move task "${draggedTask.title}" from bucket "${sourceBucketId}" to position of task "${targetTask.title}" in bucket "${targetBucketId}"`
      );

      if (sourceBucketId === targetBucketId) {
        reorderTasksInBucket(sourceBucketId, draggedTask.id, targetTask.id);
      } else {
        moveTaskToBucket(
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

      console.log(
        `Move task "${draggedTask.title}" from bucket "${sourceBucketId}" to end of bucket "${targetBucketId}"`
      );

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
        // Move to end of bucket (no targetTaskId)
        moveTaskToBucket(sourceBucketId, targetBucketId, draggedTask.id);
      }
    }

    setDraggedTask(null);
  };

  const handleDragCancel = () => {
    setDraggedTask(null);
  };

  const handleCreateTask = (newTask: NewTask) => {
    // Generate a unique ID (in production, this would come from the backend)
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const task: Task = {
      ...newTask,
      id,
    };

    setTasks((prevTasks) => [...prevTasks, task]);
    console.log("Added new task:", task);
  };

  const handleUpdateTask = (editedTask: EditedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === editedTask.id
          ? { ...task, ...editedTask, updatedAt: new Date() }
          : task
      )
    );
    console.log("Updated task:", editedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    console.log("Deleted task with ID:", taskId);
  };

  const handleDuplicateTask = (task: Task) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
        console.log(
          `Current bucket full. Moving duplicate to "${availableBucket.name}"`
        );
      } else {
        console.warn("No available buckets with capacity for duplicate");
        return;
      }
    }

    const duplicatedTask: Task = {
      ...task,
      id,
      title: `${task.title} (copy)`,
      bucketId: targetBucketId,
      orderInBucket: tasks.filter((t) => t.bucketId === targetBucketId).length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prevTasks) => [...prevTasks, duplicatedTask]);
    console.log("Duplicated task:", duplicatedTask);
  };

  const handleMoveToTask = (taskId: string, targetBucketId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const sourceBucketId = task.bucketId;

    // Use existing moveTaskToBucket function
    moveTaskToBucket(sourceBucketId, targetBucketId, taskId);
    console.log(`Moved task ${taskId} to bucket ${targetBucketId}`);
  };

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
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onMoveToTask={handleMoveToTask}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)", // Bounce easing
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
