export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "blocked"
  | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags: string[];

  // Database relationships
  bucketId: string;
  orderInBucket: number;
  userId: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Bucket {
  id: string;
  name: string;
  limit?: number;
  order: number;
  tasks: Task[];
  collapsed: boolean;
  isOneThing?: boolean;

  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
