import type { TaskPriority } from "@/types/task";
import {
  priorityStyles,
  priorityLabels,
  badgeBaseClasses,
} from "./badgeStyles";

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`${badgeBaseClasses} ${priorityStyles[priority]}`}>
      {priorityLabels[priority]}
    </span>
  );
}
