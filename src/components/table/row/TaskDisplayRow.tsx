import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Bucket } from "@/types/task";
import { cn } from "@/lib/utils";
import type { TaskDragDataType } from "@/types/dnd";
import { useEffect, useState } from "react";
import ActionsCell from "../cells/ActionsCell";

interface TaskDisplayRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  isCompleted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveTo?: (bucketId: string) => void;
  onToggleComplete?: () => void;
  buckets?: Bucket[];
}

const TaskDisplayRow = ({
  row,
  isPreview = false,
  isCompleted = false,
  onClick,
  onDelete,
  onDuplicate,
  onMoveTo,
  onToggleComplete,
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
    disabled: isPreview || isCompleted,
  });

  const activeData = active?.data?.current as TaskDragDataType;

  // Extract primitive values to avoid dependency issues
  const draggedTaskId = activeData?.task?.id;
  const draggedTaskBucketId = activeData?.task?.bucketId;
  const draggedTaskOrder = activeData?.task?.orderInBucket;
  const currentTaskId = row.original.id;
  const currentTaskBucketId = row.original.bucketId;
  const currentTaskOrder = row.original.orderInBucket;

  useEffect(() => {
    // If dragging or not hovering over this row, there should be no insert position border
    if (!isOver || isDragging) {
      setInsertPosition(null);
      return;
    }

    if (!draggedTaskId) {
      setInsertPosition(null);
      return;
    }

    if (draggedTaskBucketId !== currentTaskBucketId) {
      setInsertPosition("above");
      return;
    }

    if (draggedTaskOrder !== undefined && currentTaskOrder !== undefined) {
      if (draggedTaskOrder < currentTaskOrder) {
        setInsertPosition("below");
      } else {
        setInsertPosition("above");
      }
    }
  }, [
    isOver,
    isDragging,
    draggedTaskId,
    draggedTaskBucketId,
    draggedTaskOrder,
    currentTaskId,
    currentTaskBucketId,
    currentTaskOrder,
  ]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : isCompleted ? 0.6 : 1,
  };

  const rowClasses = cn(
    "flex border-b border-gray-100 transition-all duration-150 relative group",
    !isPreview && "hover:bg-gray-50",
    insertPosition === "above" && "border-t-2 border-t-blue-500",
    insertPosition === "below" && "border-b-2 border-b-blue-500"
  );

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

      {/* Actions Column */}
      {!isPreview && (
        <div
          className="px-3 py-2.5 flex items-center justify-center min-h-[42px]"
          style={{ width: "80px", minWidth: "80px" }}
        >
          <ActionsCell
            mode="display"
            buckets={buckets}
            currentBucketId={row.original.bucketId}
            currentStatus={row.original.status}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveTo={onMoveTo}
            onToggleComplete={onToggleComplete}
          />
        </div>
      )}
    </div>
  );
};

export default TaskDisplayRow;
