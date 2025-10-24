import type { TaskStatus } from "@/types/task";

interface StatusBadgeProps {
  status: TaskStatus;
}

const statusStyles: Record<TaskStatus, string> = {
  "not-started": "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const statusLabels: Record<TaskStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
