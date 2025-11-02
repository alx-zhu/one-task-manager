/**
 * Task API Operations
 *
 * All functions return Promises to simulate async API calls.
 * This matches the signature of future Supabase/REST API calls.
 *
 * Future implementation will replace localStorage with:
 * - Supabase queries: supabase.from('tasks').select()
 * - REST API: fetch('/api/tasks')
 */

import type { Task, NewTask, EditedTask, TaskStatus } from "@/types/task";
import { simulateApiCall } from "./client";
import { mockTasks } from "@/data/mockData";

// Storage key for localStorage
const TASKS_STORAGE_KEY = "one-task-manager:tasks";

/**
 * Initialize localStorage with mock data if empty
 */
const initializeStorage = (): void => {
  if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(mockTasks));
  }
};

/**
 * Get tasks from storage
 */
const getTasksFromStorage = (): Task[] => {
  initializeStorage();
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save tasks to storage
 */
const saveTasksToStorage = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

/**
 * Fetch all tasks
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .select('*')
 *   .order('order_in_bucket', { ascending: true });
 * if (error) throw error;
 * return data;
 * ```
 */
export const fetchTasks = async (): Promise<Task[]> => {
  const tasks = getTasksFromStorage();
  return simulateApiCall(tasks);
};

/**
 * Create a new task
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .insert([newTask])
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const createTask = async (newTask: NewTask): Promise<Task> => {
  const tasks = getTasksFromStorage();

  // Generate ID (in production, DB generates this)
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const task: Task = {
    ...newTask,
    id,
  };

  const updatedTasks = [...tasks, task];
  saveTasksToStorage(updatedTasks);

  return simulateApiCall(task);
};

/**
 * Update an existing task
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .update(updatedTask)
 *   .eq('id', taskId)
 *   .select()
 *   .single();
 * if (error) throw error;
 * return data;
 * ```
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<EditedTask>
): Promise<Task> => {
  const tasks = getTasksFromStorage();

  const updatedTasks = tasks.map((task) =>
    task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
  );

  saveTasksToStorage(updatedTasks);

  const updatedTask = updatedTasks.find((t) => t.id === taskId);
  if (!updatedTask) throw new Error(`Task ${taskId} not found`);

  return simulateApiCall(updatedTask);
};

/**
 * Delete a task
 *
 * Future Supabase implementation:
 * ```ts
 * const { error } = await supabase
 *   .from('tasks')
 *   .delete()
 *   .eq('id', taskId);
 * if (error) throw error;
 * ```
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const tasks = getTasksFromStorage();
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  saveTasksToStorage(updatedTasks);

  return simulateApiCall(undefined);
};

/**
 * Bulk update tasks (for reordering, moving between buckets)
 *
 * Future Supabase implementation:
 * ```ts
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .upsert(updates)
 *   .select();
 * if (error) throw error;
 * return data;
 * ```
 */
export const bulkUpdateTasks = async (
  updates: Partial<Task>[]
): Promise<Task[]> => {
  const tasks = getTasksFromStorage();

  const updateMap = new Map(updates.map((u) => [u.id, u]));

  const updatedTasks = tasks.map((task) => {
    const update = updateMap.get(task.id);
    return update ? { ...task, ...update, updatedAt: new Date() } : task;
  });

  saveTasksToStorage(updatedTasks);

  return simulateApiCall(updatedTasks.filter((t) => updateMap.has(t.id!)));
};

/**
 * Move task to different bucket
 * This is a convenience wrapper that will translate to proper DB operations
 */
export const moveTaskToBucket = async (
  taskId: string,
  targetBucketId: string,
  newOrder: number
): Promise<Task> => {
  return updateTask(taskId, {
    id: taskId,
    bucketId: targetBucketId,
    orderInBucket: newOrder,
  });
};

/**
 * Toggle task completion status
 */
export const toggleTaskCompletion = async (
  taskId: string,
  currentStatus: string
): Promise<Task> => {
  const newStatus = currentStatus === "completed" ? "not-started" : "completed";
  return updateTask(taskId, {
    id: taskId,
    status: newStatus as TaskStatus,
  });
};
