import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Task, Bucket } from "@/types/task";
import TaskRow from "./row/TaskRow";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface TaskTableProps {
  data: Task[];
  columns: ColumnDef<Task>[];
  buckets?: Bucket[];
}

// Keep TaskTable only responsible for rendering the table structure
export function TaskTable({ data, columns }: TaskTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isEmpty = data.length === 0;

  return (
    <>
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
        {/* Actions Header */}
        <div
          className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center"
          style={{ width: "80px", minWidth: "80px" }}
        ></div>
      </div>

      {/* Table Body */}
      <SortableContext
        items={table.getRowModel().rows.map((row) => row.id)}
        strategy={verticalListSortingStrategy}
      >
        {isEmpty ? (
          <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 m-4 rounded-lg">
            No tasks in this bucket.
          </div>
        ) : (
          <div>
            {table.getRowModel().rows.map((row) => (
              <TaskRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </SortableContext>
    </>
  );
}
