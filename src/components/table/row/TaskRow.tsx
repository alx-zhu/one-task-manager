import { useState, memo } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { Task, Bucket } from "@/types/task";
import {
  useDeleteTask,
  useDuplicateTask,
  useUpdateTask,
  useUncompleteTask,
} from "@/hooks/useTasks";
import { useMoveTaskToBucket } from "@/hooks/useTaskDragOperations";
import { useHydratedBuckets } from "@/hooks/useBuckets";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  isCompleted?: boolean;
  buckets?: Bucket[];
}

const TaskRow = memo(
  ({ row, isPreview = false, isCompleted = false }: TaskRowProps) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [focusColumn, setFocusColumn] = useState<string | null>(null);
    const { data: buckets = [] } = useHydratedBuckets();

    // Keep all mutations in top level TaskRow rather than individual display/edit variants
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: deleteTask } = useDeleteTask();
    const { mutate: duplicateTask } = useDuplicateTask();
    const { mutate: uncompleteTask } = useUncompleteTask();
    const moveTaskToBucket = useMoveTaskToBucket();

    const handleClick = (e: React.MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;

      // Don't trigger edit on actions dropdown
      if (e.target.closest("[data-actions-cell]")) {
        return;
      }

      // Don't trigger edit on drag handle
      if (e.target.closest("[data-drag-handle]")) {
        return;
      }

      // Find which column was clicked
      const columnElement = e.target.closest("[data-column-id]");
      const columnId = columnElement?.getAttribute("data-column-id") || null;

      setFocusColumn(columnId);
      setIsEditing(true);
    };

    const toggleTaskCompletion = () => {
      if (isCompleted) {
        uncompleteTask(row.original, {
          onSuccess: () => {
            console.log(
              `Task "${row.original.title}" uncompleted and moved to bucket: ${row.original.bucketId}`
            );
            // TODO: Add visual highlighting of the task in its new location
          },
          onError: (error) => {
            console.error("Failed to uncomplete task:", error);
            // TODO: Replace with toast notification
          },
        });
      } else {
        updateTask({
          taskId: row.original.id,
          updates: {
            status: "completed",
          },
        });
      }
    };

    const handleDuplicate = () => {
      duplicateTask(row.original, {
        onSuccess: () => {
          console.log(`Task "${row.original.title}" duplicated successfully`);
          // TODO: Add visual highlighting of the new task
        },
        onError: (error) => {
          console.error("Failed to duplicate task:", error);
          // TODO: Replace with toast notification
        },
      });
    };

    // Don't want preview row to be editable
    if (isPreview) {
      return <TaskDisplayRow row={row} isPreview />;
    }

    return isEditing ? (
      <TaskEditRow
        bucketId={row.original.bucketId}
        existingTask={row.original}
        focusColumn={focusColumn}
        onSaveEditTask={(updatedTask) => {
          updateTask({ taskId: row.original.id, updates: updatedTask });
          setIsEditing(false);
          setFocusColumn(null);
        }}
        onCancel={() => {
          setIsEditing(false);
          setFocusColumn(null);
        }}
      />
    ) : (
      <TaskDisplayRow
        row={row}
        onClick={handleClick}
        onDelete={() => deleteTask(row.original.id)}
        onDuplicate={handleDuplicate}
        onMoveTo={
          isCompleted
            ? undefined
            : (bucketId) => moveTaskToBucket(row.original, bucketId)
        }
        onToggleComplete={toggleTaskCompletion}
        buckets={buckets}
        isCompleted={isCompleted}
      />
    );
  }
);

TaskRow.displayName = "TaskRow";

export default TaskRow;
