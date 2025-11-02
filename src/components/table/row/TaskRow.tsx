import { useState } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { Task, Bucket } from "@/types/task";
import {
  useDeleteTask,
  useDuplicateTask,
  useUpdateTask,
} from "@/hooks/useTasks";
import { useMoveTaskToBucket } from "@/hooks/useTaskDragOperations";
import { useBuckets } from "@/hooks/useBuckets";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  buckets?: Bucket[];
}

const TaskRow = ({ row, isPreview = false }: TaskRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [focusColumn, setFocusColumn] = useState<string | null>(null);
  const { data: buckets = [] } = useBuckets();

  // Keep all mutations in top level TaskRow rather than individual display/edit variants
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const duplicateTask = useDuplicateTask(); // duplicateTask uses createTask internally
  const moveTaskToBucket = useMoveTaskToBucket();

  const handleClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

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
    const currentStatus = row.original.status;
    updateTask({
      taskId: row.original.id,
      updates: {
        status: currentStatus === "completed" ? "not-started" : "completed",
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
      onDuplicate={() => duplicateTask(row.original, buckets)}
      onMoveTo={(bucketId) => moveTaskToBucket(row.original, bucketId)}
      onToggleComplete={toggleTaskCompletion}
      buckets={buckets}
    />
  );
};

export default TaskRow;
