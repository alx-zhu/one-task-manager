import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import type { Task } from "@/types/task";
import TaskRow from "./row/TaskRow";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";

interface TaskTableProps {
  data: Task[];
  columns: ColumnDef<Task>[];
  /** Custom row renderer. If not provided, defaults to TaskRow */
  renderRow?: (row: Row<Task>) => ReactNode;
  /** Whether to wrap rows in SortableContext (for drag & drop). Defaults to true */
  enableSorting?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
}

// Keep TaskTable only responsible for rendering the table structure
export function TaskTable({
  data,
  columns,
  renderRow,
  enableSorting = true,
  emptyMessage = "No tasks in this bucket.",
}: TaskTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isEmpty = data.length === 0;

  // Default row renderer if not provided
  const defaultRenderRow = (row: Row<Task>) => (
    <TaskRow key={row.id} row={row} />
  );
  const rowRenderer = renderRow || defaultRenderRow;

  // Render rows with optional sortable context
  const renderRows = () => {
    if (isEmpty) {
      return (
        <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 m-4 rounded-lg">
          {emptyMessage}
        </div>
      );
    }

    const rows = table.getRowModel().rows.map((row) => rowRenderer(row));

    if (enableSorting) {
      return (
        <SortableContext
          items={table.getRowModel().rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>{rows}</div>
        </SortableContext>
      );
    }

    return <div>{rows}</div>;
  };

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
      {renderRows()}
    </>
  );
}
