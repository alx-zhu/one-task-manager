import { flexRender, type Row } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";

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
  } = useSortable({
    id: row.original.id,
    data: {
      task: row.original,
      type: "task",
    },
    disabled: isPreview,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      key={row.id}
      style={style}
      ref={setNodeRef}
      className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
    </div>
  );
};

export default TaskRow;
