import { useState } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { EditedTask, Task } from "@/types/task";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  onUpdateTask: (taskId: string, updatedTask: EditedTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onMoreOptions?: (taskId: string) => void;
}

const TaskRow = ({
  row,
  isPreview = false,
  onUpdateTask,
  onDeleteTask,
  onMoreOptions,
}: TaskRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Don't want preview row to be editable
  if (isPreview) {
    return <TaskDisplayRow row={row} isPreview />;
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

    if (
      e.target.closest("[data-drag-handle]") ||
      e.target.closest("[data-checkbox]")
    ) {
      return;
    }

    setIsEditing(true);
  };

  return isEditing ? (
    <TaskEditRow
      bucketId={row.original.bucketId}
      existingTask={row.original}
      onSaveEditTask={(updatedTask) => {
        onUpdateTask(row.original.id, updatedTask);
        setIsEditing(false);
      }}
      onCancel={() => setIsEditing(false)}
    />
  ) : (
    <TaskDisplayRow
      row={row}
      onDoubleClick={handleDoubleClick}
      onDelete={onDeleteTask}
      onMoreOptions={onMoreOptions}
    />
  );
};

export default TaskRow;
