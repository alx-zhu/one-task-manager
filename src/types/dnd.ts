// types/dnd.ts
import type { Task, Bucket } from "./task";

interface TaskDragData {
  type: "task";
  task: Task;
}

interface BucketDragData {
  type: "bucket";
  bucket: Bucket;
}

export type TaskDragDataType = TaskDragData | undefined;

export type BucketDragDataType = BucketDragData | undefined;

export type DragDataType = TaskDragData | BucketDragData | undefined;
