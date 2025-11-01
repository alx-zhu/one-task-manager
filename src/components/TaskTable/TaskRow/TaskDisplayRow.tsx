import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import type { TaskDragDataType } from "@/types/dnd";
import { useEffect, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

interface TaskDisplayRowProps {
  row: Row<Task>;
  isPreview?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: (taskId: string) => void;
  onMoreOptions?: (taskId: string) => void;
}

const TaskDisplayRow = ({
  row,
  isPreview = false,
  onClick,
  onDelete,
  onMoreOptions,
}: TaskDisplayRowProps) => {
  const [insertPosition, setInsertPosition] = useState<
    "above" | "below" | null
  >(null);
  const [isHovered, setIsHovered] = useState(false);
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
    "flex border-b border-gray-100 transition-all duration-150 relative",
    !isPreview && "hover:bg-gray-50",
    insertPosition === "above" && "border-t-2 border-t-blue-500",
    insertPosition === "below" && "border-b-2 border-b-blue-500"
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(row.original.id);
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreOptions?.(row.original.id);
  };

  return (
    <div
      key={row.id}
      style={style}
      ref={setNodeRef}
      className={rowClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      {isHovered && !isPreview && !isDragging && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-1 gap-1 bg-white/70 backdrop-blur-md rounded shadow-sm">
          <button
            onClick={handleDelete}
            className="relative z-10 p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleMoreOptions}
            className="relative z-10 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDisplayRow;
