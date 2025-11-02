import type { Task } from "@/types/task";

interface TaskCheckboxProps {
  task: Task;
  onChange?: (task: Task) => void;
}

export function TaskCheckbox({ task, onChange }: TaskCheckboxProps) {
  return (
    <div className="flex items-center justify-center" data-checkbox>
      <div
        className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer transition-colors hover:border-gray-400"
        onClick={() => onChange?.(task)}
      />
    </div>
  );
}
