import type { TaskStatus } from "@/types/task";
import { statusStyles, statusLabels, badgeBaseClasses } from "./badgeStyles";

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${badgeBaseClasses} ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
