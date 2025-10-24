import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Task } from "@/types/task";

interface TaskTableProps {
  data: Task[];
  columns: ColumnDef<Task>[];
  onAddTask?: () => void;
}

export function TaskTable({ data, columns, onAddTask }: TaskTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="task-table">
      {/* Table Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => {
            const size = header.column.columnDef.size;
            const isTaskColumn = header.column.id === "task";
            const minWidth = isTaskColumn ? 250 : size;

            return (
              <div
                key={header.id}
                className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center border-r border-gray-200 last:border-r-0"
                style={{
                  width: size ? `${size}px` : undefined,
                  minWidth: minWidth ? `${minWidth}px` : undefined,
                  flex: isTaskColumn ? "1" : undefined,
                }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Table Body */}
      <div>
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            {row.getVisibleCells().map((cell) => {
              const size = cell.column.columnDef.size;
              const isTaskColumn = cell.column.id === "task";
              const minWidth = isTaskColumn ? 250 : size;

              return (
                <div
                  key={cell.id}
                  className="px-3 py-2.5 flex items-center border-r border-gray-100 last:border-r-0 min-h-[42px]"
                  style={{
                    width: size ? `${size}px` : undefined,
                    minWidth: minWidth ? `${minWidth}px` : undefined,
                    flex: isTaskColumn ? "1" : undefined,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Add Task Row */}
      {onAddTask && (
        <div className="flex p-2 border-t border-gray-100">
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded transition-colors hover:bg-gray-50"
          >
            <span>+</span>
            <span>Add task</span>
          </button>
        </div>
      )}
    </div>
  );
}
