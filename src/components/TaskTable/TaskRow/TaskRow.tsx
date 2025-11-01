import { useState, useRef, useEffect } from "react";
import TaskEditRow from "./TaskEditRow";
import TaskDisplayRow from "./TaskDisplayRow";
import type { Row } from "@tanstack/react-table";
import type { EditedTask, Task } from "@/types/task";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  onUpdateTask: (taskId: string, updatedTask: EditedTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

const TaskRow = ({
  row,
  isPreview = false,
  onUpdateTask,
  onDeleteTask,
}: TaskRowProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const editRowRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to save and keyboard events
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        editRowRef.current &&
        !editRowRef.current.contains(e.target as Node)
      ) {
        onUpdateTask(row.original.id, row.original);
        setIsEditing(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onUpdateTask(row.original.id, row.original);
        setIsEditing(false);
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing, onUpdateTask, row.original]);

  const handleClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

    if (
      e.target.closest("[data-drag-handle]") ||
      e.target.closest("[data-checkbox]")
    ) {
      return;
    }

    setIsEditing(true);
  };

  // Don't want preview row to be editable
  if (isPreview) {
    return <TaskDisplayRow row={row} isPreview />;
  }

  return isEditing ? (
    <div ref={editRowRef}>
      <TaskEditRow
        bucketId={row.original.bucketId}
        existingTask={row.original}
        onSaveEditTask={(updatedTask) => {
          onUpdateTask(row.original.id, updatedTask);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  ) : (
    <TaskDisplayRow row={row} onClick={handleClick} onDelete={onDeleteTask} />
  );
};

export default TaskRow;
