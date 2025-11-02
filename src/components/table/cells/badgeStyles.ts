import type { TaskStatus, TaskPriority } from "@/types/task";

export const statusStyles: Record<TaskStatus, string> = {
  "not-started": "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

export const statusHoverStyles: Record<TaskStatus, string> = {
  "not-started": "hover:bg-gray-200 focus:bg-gray-200",
  "in-progress": "hover:bg-blue-200 focus:bg-blue-200",
  blocked: "hover:bg-red-200 focus:bg-red-200",
  completed: "hover:bg-green-200 focus:bg-green-200",
};

export const statusLabels: Record<TaskStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

export const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-200 text-red-800",
};

export const priorityHoverStyles: Record<TaskPriority, string> = {
  low: "hover:bg-gray-200 focus:bg-gray-200",
  medium: "hover:bg-yellow-200 focus:bg-yellow-200",
  high: "hover:bg-orange-200 focus:bg-orange-200",
  urgent: "hover:bg-red-300 focus:bg-red-300",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const badgeBaseClasses =
  "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap";
