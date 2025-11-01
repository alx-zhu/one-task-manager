import { useState } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { EditedTask, Task, Bucket } from "@/types/task";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  onUpdateTask: (taskId: string, updatedTask: EditedTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onMoveToTask?: (taskId: string, bucketId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  buckets?: Bucket[];
}

const TaskRow = ({
  row,
  isPreview = false,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onMoveToTask,
  onToggleComplete,
  buckets = [],
}: TaskRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [focusColumn, setFocusColumn] = useState<string | null>(null);

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
        onUpdateTask(row.original.id, updatedTask);
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
      onDelete={onDeleteTask}
      onDuplicate={onDuplicateTask}
      onMoveTo={onMoveToTask}
      onToggleComplete={onToggleComplete}
      buckets={buckets}
    />
  );
};

export default TaskRow;
