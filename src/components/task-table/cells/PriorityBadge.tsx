import type { TaskPriority } from "@/types/task";

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-200 text-red-800",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${priorityStyles[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
