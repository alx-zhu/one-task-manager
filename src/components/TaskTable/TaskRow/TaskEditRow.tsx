import { useState, useRef, useEffect } from "react";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  NewTask,
  EditedTask,
} from "@/types/task";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActionsCell from "./ActionsCell";
import {
  statusStyles,
  statusHoverStyles,
  statusLabels,
  priorityStyles,
  priorityHoverStyles,
  priorityLabels,
  badgeBaseClasses,
} from "../cells/badgeStyles";
import { format } from "date-fns/format";

interface TaskEditRowProps {
  bucketId: string;
  onSaveNewTask?: (task: Omit<NewTask, "orderInBucket">) => void;
  onSaveEditTask?: (task: EditedTask) => void;
  onCancel: () => void;
  existingTask?: Task;
  focusColumn?: string | null;
}

const TaskEditRow = ({
  bucketId,
  onSaveNewTask,
  onSaveEditTask,
  onCancel,
  existingTask,
  focusColumn = null,
}: TaskEditRowProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const statusSelectRef = useRef<HTMLButtonElement>(null);
  const prioritySelectRef = useRef<HTMLButtonElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState<string>(existingTask?.title || "");
  const [description, setDescription] = useState<string>(
    existingTask?.description || ""
  );
  const [status, setStatus] = useState<TaskStatus>(
    existingTask?.status || "not-started"
  );
  const [priority, setPriority] = useState<TaskPriority>(
    existingTask?.priority || "medium"
  );
  const [dueDate, setDueDate] = useState<string>(
    existingTask?.dueDate ? format(existingTask.dueDate, "yyyy-MM-dd") : ""
  );
  const [tags, setTags] = useState<string>(existingTask?.tags.join(", ") || "");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Focus the appropriate field based on which column was clicked
    if (focusColumn === "task") {
      titleInputRef.current?.focus();
    } else if (focusColumn === "status") {
      statusSelectRef.current?.click();
    } else if (focusColumn === "priority") {
      prioritySelectRef.current?.click();
    } else if (focusColumn === "dueDate") {
      dueDateInputRef.current?.focus();
    } else if (focusColumn === "tags") {
      tagsInputRef.current?.focus();
    } else {
      // Default to title if no specific column or drag/checkbox clicked
      titleInputRef.current?.focus();
    }
  }, [focusColumn]);

  const handleSaveNewTask = () => {
    if (!title.trim()) {
      setShowError(true);
      titleInputRef.current?.focus();
      return;
    }

    const newTask: Omit<Task, "id" | "orderInBucket"> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      bucketId,
      userId: "user-1", // TODO: Replace with actual user ID
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSaveNewTask?.(newTask);
  };

  const handleSaveEditTask = () => {
    if (!title.trim()) {
      setShowError(true);
      titleInputRef.current?.focus();
      return;
    }

    const updatedTask: EditedTask = {
      ...existingTask,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      updatedAt: new Date(),
    };

    onSaveEditTask?.(updatedTask);
  };

  const handleSave = () => {
    if (existingTask) {
      handleSaveEditTask();
    } else {
      handleSaveNewTask();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex border-b-2 border-blue-400 bg-blue-50/30">
      {/* Save Button */}
      <div
        className="px-3 py-2.5 flex items-center justify-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "40px", minWidth: "40px" }}
      ></div>

      {/* Task Title + Description */}
      <div
        className={`px-3 py-2.5 flex flex-col gap-1 border-r border-gray-100 min-h-[42px] ${
          showError ? "border-l-2 border-l-red-500" : ""
        }`}
        style={{ flex: 1, minWidth: "250px" }}
      >
        <Input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
            if (showError && e.target.value.trim()) {
              setShowError(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Task title... ${showError ? "(required)" : ""}`}
          className={`text-sm h-auto border-none shadow-none p-0 focus-visible:ring-0 rounded-none ${
            showError ? "placeholder:text-red-500" : ""
          }`}
        />
        <Input
          ref={descriptionInputRef}
          type="text"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Add description (optional)"
          className="text-xs h-auto border-none shadow-none p-0 focus-visible:ring-0 placeholder:text-xs rounded-none"
        />
      </div>

      {/* Status */}
      <div
        className="px-3 py-2.5 flex items-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "140px", minWidth: "140px" }}
      >
        <Select
          value={status}
          onValueChange={(value: string) => setStatus(value as TaskStatus)}
        >
          <SelectTrigger
            ref={statusSelectRef}
            className={`h-7 border-none shadow-none ${badgeBaseClasses} ${statusStyles[status]} ${statusHoverStyles[status]} transition-colors`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="p-1.5">
            {(Object.keys(statusStyles) as TaskStatus[]).map((statusKey) => (
              <SelectItem
                key={statusKey}
                value={statusKey}
                className={`${badgeBaseClasses} ${statusStyles[statusKey]} ${statusHoverStyles[statusKey]} transition-colors cursor-pointer rounded mb-1 last:mb-0`}
              >
                {statusLabels[statusKey]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div
        className="px-3 py-2.5 flex items-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "120px", minWidth: "120px" }}
      >
        <Select
          value={priority}
          onValueChange={(value: string) => setPriority(value as TaskPriority)}
        >
          <SelectTrigger
            ref={prioritySelectRef}
            className={`h-7 border-none shadow-none ${badgeBaseClasses} ${priorityStyles[priority]} ${priorityHoverStyles[priority]} transition-colors`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="p-1.5">
            {(Object.keys(priorityStyles) as TaskPriority[]).map(
              (priorityKey) => (
                <SelectItem
                  key={priorityKey}
                  value={priorityKey}
                  className={`${priorityStyles[priorityKey]} ${priorityHoverStyles[priorityKey]} transition-colors cursor-pointer rounded mb-1 last:mb-0`}
                >
                  {priorityLabels[priorityKey]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date */}
      <div
        className="px-3 py-2.5 flex items-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "130px", minWidth: "130px" }}
      >
        <Input
          ref={dueDateInputRef}
          type="date"
          value={dueDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDueDate(e.target.value)
          }
          onKeyDown={handleKeyDown}
          className="text-sm h-7"
        />
      </div>

      {/* Tags */}
      <div
        className="px-3 py-2.5 flex items-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "160px", minWidth: "160px" }}
      >
        <Input
          ref={tagsInputRef}
          type="text"
          value={tags}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTags(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="tag1, tag2..."
          className="text-xs h-7 w-full"
        />
      </div>

      {/* Actions */}
      <div
        className="px-3 py-2.5 flex items-center justify-center min-h-[42px]"
        style={{ width: "80px", minWidth: "80px" }}
      >
        <ActionsCell mode="edit" onSave={handleSave} onCancel={onCancel} />
      </div>
    </div>
  );
};

export default TaskEditRow;
