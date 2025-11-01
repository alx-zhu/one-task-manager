import { useState } from "react";
import type { Bucket, EditedTask, NewTask } from "@/types/task";
import { TaskTable } from "./TaskTable";
import { taskColumns } from "./columns";
import { AnimatePresence, motion } from "framer-motion";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type {
  BucketDragDataType,
  DragDataType,
  TaskDragDataType,
} from "@/types/dnd";

interface BucketSectionProps {
  bucket: Bucket;
  onCreateTask: (task: NewTask) => void;
  onUpdateTask: (task: EditedTask) => void;
  onDeleteTask: (taskId: string) => void;
}

export function BucketSection({
  bucket,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: BucketSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(bucket.collapsed);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const { active, over } = useDndContext();

  const { setNodeRef } = useDroppable({
    id: bucket.id,
    data: { type: "bucket", bucket } satisfies BucketDragDataType,
  });

  const activeData = active?.data?.current as TaskDragDataType;
  const draggedTask = activeData?.task;
  const isAtCapacity =
    draggedTask &&
    bucket.limit &&
    bucket.tasks.length >= bucket.limit &&
    draggedTask.bucketId !== bucket.id;

  const overData = over?.data?.current as DragDataType;
  const isOver =
    (overData?.type === "bucket" && over?.id === bucket.id) ||
    (overData?.type === "task" && bucket.id === overData?.task.bucketId);

  const getBucketCountClass = () => {
    if (!bucket.limit) {
      return "bg-gray-100 text-gray-600";
    }

    if (bucket.tasks.length >= bucket.limit) {
      return "bg-red-200 text-red-800";
    }

    if (bucket.tasks.length >= bucket.limit - 1) {
      return "bg-yellow-100 text-yellow-800";
    }

    return "bg-gray-100 text-gray-600";
  };

  const getContainerClass = () => {
    return cn(
      "rounded-lg overflow-hidden mb-4 transition-all duration-200 bg-white",
      bucket.isOneThing
        ? [
            "border-2",
            isOver
              ? isAtCapacity
                ? "border-red-500 ring-4 ring-red-500/10 shadow-lg"
                : "border-gray-900 ring-4 ring-gray-900/10 shadow-lg"
              : "border-gray-900",
          ]
        : [
            "border",
            isOver
              ? isAtCapacity
                ? "border-red-400 ring-4 ring-red-400/10 shadow-lg bg-red-50/50"
                : "border-blue-400 ring-4 ring-blue-400/10 shadow-lg bg-blue-50/50"
              : "border-gray-200",
          ]
    );
  };

  const getHeaderClass = () => {
    return cn(
      "flex items-center justify-between cursor-pointer select-none transition-colors border-b",
      bucket.isOneThing
        ? "px-5 py-4 bg-gray-900 text-white hover:bg-gray-800 border-gray-700"
        : "px-5 py-3 hover:bg-gray-50 border-gray-200"
    );
  };

  const getChevronClass = () => {
    return cn(
      "text-base leading-none transition-transform",
      bucket.isOneThing ? "text-white/70" : "text-gray-400",
      isCollapsed && "-rotate-90"
    );
  };

  const getCountClass = () => {
    if (bucket.isOneThing) {
      return `px-2 py-0.5 rounded-xl text-xs font-medium bg-white/20 text-white`;
    }
    return `px-2 py-0.5 rounded-xl text-xs font-medium ${getBucketCountClass()}`;
  };

  const getMenuClass = () => {
    return cn(
      "text-xl leading-none cursor-pointer p-1",
      bucket.isOneThing
        ? "text-white/70 hover:text-white"
        : "text-gray-400 hover:text-gray-600"
    );
  };

  const handleAddTaskClick = () => {
    // Check if bucket is at capacity
    if (bucket.limit && bucket.tasks.length >= bucket.limit) {
      console.warn(`Bucket "${bucket.name}" is at capacity`);
      return;
    }
    setIsAddingTask(true);
  };

  const handleSaveNewTask = (task: NewTask) => {
    if (onCreateTask) {
      onCreateTask(task);
    }
    setIsAddingTask(false);
  };

  const handleSaveEditTask = (task: EditedTask) => {
    if (onUpdateTask) {
      onUpdateTask(task);
    }
  };

  const handleUpdateTask = (taskId: string, updatedTask: EditedTask) => {
    if (onUpdateTask) {
      onUpdateTask({ ...updatedTask, id: taskId });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    onDeleteTask?.(taskId);
  };

  const handleCancelAddTask = () => {
    setIsAddingTask(false);
  };

  const canAddTask = !bucket.limit || bucket.tasks.length < bucket.limit;

  return (
    <div ref={setNodeRef} className={getContainerClass()}>
      {/* Bucket Header */}
      <div
        className={getHeaderClass()}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={getChevronClass()}>▼</span>
          <span className="font-medium text-sm">{bucket.name}</span>
          <span className={getCountClass()}>
            {bucket.tasks.length}
            {bucket.limit && `/${bucket.limit}`}
          </span>
        </div>
        <span
          className={getMenuClass()}
          onClick={(e) => {
            e.stopPropagation();
            // Handle menu click
          }}
        >
          ⋮
        </span>
      </div>

      {/* Table Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                isOver &&
                  overData?.type === "bucket" &&
                  // Don't add border if it is the same bucket as the draggedTask
                  overData.bucket.id !== draggedTask?.bucketId &&
                  "border-b-2 border-b-blue-500"
              )}
            >
              <TaskTable
                data={bucket.tasks}
                columns={taskColumns}
                bucketId={bucket.id}
                isAddingTask={isAddingTask}
                onSaveNewTask={handleSaveNewTask}
                onSaveEditTask={handleSaveEditTask}
                onUpdateTask={handleUpdateTask}
                onCancelAddTask={handleCancelAddTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
            {/* Add Task Row */}
            {!isAddingTask && (
              <div className="flex p-2 border-t border-gray-100">
                <button
                  onClick={handleAddTaskClick}
                  disabled={!canAddTask}
                  className={cn(
                    "flex items-center gap-2 text-sm px-2 py-1.5 rounded transition-colors",
                    canAddTask
                      ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                >
                  {canAddTask && <span>+</span>}
                  <span>
                    {canAddTask
                      ? "Add task"
                      : `Limit reached (${bucket.tasks.length}/${bucket.limit})`}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
