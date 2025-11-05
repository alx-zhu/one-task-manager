import type { Bucket, Task } from "@/types/task";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hydrateBucketsWithTasks(
  buckets: Bucket[],
  tasks: Task[]
): Bucket[] {
  return buckets
    .map((bucket) => ({
      ...bucket,
      tasks: tasks
        .filter((task) => task.bucketId === bucket.id)
        .sort((a, b) => a.orderInBucket - b.orderInBucket),
    }))
    .sort((a, b) => a.order - b.order);
}
