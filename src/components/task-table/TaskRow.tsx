import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import type { TaskDragDataType } from "@/types/dnd";

interface TaskRowProps {
  row: Row<Task>;
  isPreview?: boolean;
}

const TaskRow = ({ row, isPreview = false }: TaskRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: row.original.id,
    data: {
      task: row.original,
      type: "task",
    } satisfies TaskDragDataType,
    disabled: isPreview,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const rowClasses = cn(
    "flex border-b border-gray-100 transition-all duration-150",
    !isPreview && "hover:bg-gray-50",
    isOver && !isDragging && "border-t-2 border-t-blue-500"
  );

  return (
    <div key={row.id} style={style} ref={setNodeRef} className={rowClasses}>
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
    </div>
  );
};

export default TaskRow;
