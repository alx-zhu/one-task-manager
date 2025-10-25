import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { taskColumns } from "./columns";
import type { Task } from "@/types/task";
import TaskRow from "./TaskRow";

interface TaskRowPreviewProps {
  task: Task;
}

export function TaskRowPreview({ task }: TaskRowPreviewProps) {
  const table = useReactTable({
    data: [task],
    columns: taskColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const row = table.getRowModel().rows[0];

  if (!row) return null;

  return <TaskRow row={row} isPreview />;
}
