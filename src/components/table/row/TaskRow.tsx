import { useState } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { Task, Bucket } from "@/types/task";
import { useTaskOperations } from "@/hooks/useTaskOperations";
import { useBuckets } from "@/hooks/useBuckets";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  buckets?: Bucket[];
}

const TaskRow = ({ row, isPreview = false, buckets = [] }: TaskRowProps) => {
  const taskOps = useTaskOperations();
  const { data: allBuckets = [] } = useBuckets();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [focusColumn, setFocusColumn] = useState<string | null>(null);

  // Use provided buckets prop or fetched buckets
  const bucketsToUse = buckets.length > 0 ? buckets : allBuckets;

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
        taskOps.updateTask(row.original.id, updatedTask);
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
      onDelete={(taskId) => taskOps.deleteTask(taskId)}
      onDuplicate={(task) => taskOps.duplicateTask(task, bucketsToUse)}
      onMoveTo={(taskId, bucketId) =>
        taskOps.moveTaskToBucket(taskId, bucketId)
      }
      onToggleComplete={(taskId) => taskOps.toggleTaskCompletion(taskId)}
      buckets={bucketsToUse}
    />
  );
};

export default TaskRow;
