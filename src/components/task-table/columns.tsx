import { type ColumnDef } from "@tanstack/react-table";
import type { Task } from "@/types/task";
import { DragHandle } from "./cells/DragHandle";
import { TaskCheckbox } from "./cells/TaskCheckbox";
import { TaskCell } from "./cells/TaskCell";
import { StatusBadge } from "./cells/StatusBadge";
import { PriorityBadge } from "./cells/PriorityBadge";
import { DueDateCell } from "./cells/DueDateCell";
import { TagsCell } from "./cells/TagsCell";

export const taskColumns: ColumnDef<Task>[] = [
  {
    id: "drag",
    header: "",
    size: 40,
    cell: () => <DragHandle />,
  },
  {
    id: "checkbox",
    header: "",
    size: 40,
    cell: ({ row }) => <TaskCheckbox task={row.original} />,
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
  {
    id: "dueDate",
    header: "Due Date",
    accessorKey: "dueDate",
    size: 130,
    cell: ({ row }) => <DueDateCell date={row.original.dueDate} />,
  },
  {
    id: "tags",
    header: "Tags",
    accessorKey: "tags",
    size: 160,
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
];
