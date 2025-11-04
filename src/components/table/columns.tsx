import { type ColumnDef } from "@tanstack/react-table";
import type { Task } from "@/types/task";
import { DragHandle } from "./cells/DragHandle";
import { TaskCell } from "./cells/TaskCell";
import { StatusBadge } from "./cells/StatusBadge";
import { PriorityBadge } from "./cells/PriorityBadge";
import { DateCell } from "./cells/DateCell";
import { TagsCell } from "./cells/TagsCell";

// Base columns shared by both active and completed tasks
const baseColumns: ColumnDef<Task>[] = [
  {
    id: "drag",
    header: "",
    size: 40,
    cell: () => <DragHandle />,
  },
  {
    id: "task",
    header: "Task",
    accessorKey: "title",
    cell: ({ row }) => (
      <TaskCell
        title={row.original.title}
        description={row.original.description}
      />
    ),
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    size: 140,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "priority",
    header: "Priority",
    accessorKey: "priority",
    size: 120,
    cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
  },
];

const dueDateColumn: ColumnDef<Task> = {
  id: "dueDate",
  header: "Due Date",
  accessorKey: "dueDate",
  size: 130,
  cell: ({ row }) => <DateCell date={row.original.dueDate} />,
};

const completedDateColumn: ColumnDef<Task> = {
  id: "completedDate",
  header: "Completed",
  accessorKey: "completedAt",
  size: 130,
  cell: ({ row }) => (
    <DateCell date={row.original.completedAt} isCompletedDate />
  ),
};

const tagsColumn: ColumnDef<Task> = {
  id: "tags",
  header: "Tags",
  accessorKey: "tags",
  size: 160,
  cell: ({ row }) => <TagsCell tags={row.original.tags} />,
};

// Active task columns (with due date)
export const taskColumns: ColumnDef<Task>[] = [
  ...baseColumns,
  dueDateColumn,
  tagsColumn,
];

// Completed task columns (with completion date)
export const completedTaskColumns: ColumnDef<Task>[] = [
  ...baseColumns,
  completedDateColumn,
  tagsColumn,
];
