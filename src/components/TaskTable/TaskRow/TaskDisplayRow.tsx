import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Bucket } from "@/types/task";
import { cn } from "@/lib/utils";
import type { TaskDragDataType } from "@/types/dnd";
import { useEffect, useState } from "react";
import TaskRowActions from "./TaskRowActions";

interface TaskDisplayRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onMoveTo?: (taskId: string, bucketId: string) => void;
  buckets?: Bucket[];
}

const TaskDisplayRow = ({
  row,
  isPreview = false,
  onClick,
  onDelete,
  onDuplicate,
  onMoveTo,
  buckets = [],
}: TaskDisplayRowProps) => {
  const [insertPosition, setInsertPosition] = useState<
    "above" | "below" | null
  >(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({
    id: row.original.id,
    data: {
      task: row.original,
      type: "task",
    } satisfies TaskDragDataType,
    disabled: isPreview,
  });

  const activeData = active?.data?.current as TaskDragDataType;

  useEffect(() => {
    // If dragging or not hovering over this row, there should be no insert position border
    if (!isOver || isDragging) {
      setInsertPosition(null);
      return;
    }

    const draggedTask = activeData?.task;
    const currentTask = row.original;
    if (!draggedTask) return;

    if (draggedTask.bucketId !== currentTask.bucketId) {
      setInsertPosition("above");
      return;
    }

    if (draggedTask.orderInBucket < currentTask.orderInBucket) {
      setInsertPosition("below");
    } else {
      setInsertPosition("above");
    }
  }, [isOver, isDragging, activeData, row.original]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const rowClasses = cn(
    "flex border-b border-gray-100 transition-all duration-150 relative group",
    !isPreview && "hover:bg-gray-50",
    insertPosition === "above" && "border-t-2 border-t-blue-500",
    insertPosition === "below" && "border-b-2 border-b-blue-500"
  );

  const handleDelete = () => {
    onDelete?.(row.original.id);
  };

  const handleDuplicate = () => {
    onDuplicate?.(row.original);
  };

  const handleMoveTo = (bucketId: string) => {
    onMoveTo?.(row.original.id, bucketId);
  };

  return (
    <div
      key={row.id}
      style={style}
      ref={setNodeRef}
      className={rowClasses}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const size = cell.column.columnDef.size;
        const isTaskColumn = cell.column.id === "task";
        const minWidth = isTaskColumn ? 250 : size;
        // Additional props for drag cell
        const dragExtras =
          cell.column.id === "drag" ? { ...attributes, ...listeners } : {};

        return (
          <div
            key={cell.id}
            data-column-id={cell.column.id}
            className="px-3 py-2.5 flex items-center border-r border-gray-100 last:border-r-0 min-h-[42px]"
            style={{
              width: size ? `${size}px` : undefined,
              minWidth: minWidth ? `${minWidth}px` : undefined,
              flex: isTaskColumn ? "1" : undefined,
            }}
            {...dragExtras}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}

      {/* Hover overlay with action buttons */}
      {!isPreview && !isDragging && (
        <TaskRowActions
          buckets={buckets}
          currentBucketId={row.original.bucketId}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMoveTo={handleMoveTo}
        />
      )}
    </div>
  );
};

export default TaskDisplayRow;
