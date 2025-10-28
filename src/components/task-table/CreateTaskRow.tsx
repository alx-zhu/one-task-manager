import { useState, useRef, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X } from "lucide-react";
import {
  statusStyles,
  statusHoverStyles,
  statusLabels,
  priorityStyles,
  priorityHoverStyles,
  priorityLabels,
  badgeBaseClasses,
} from "./cells/badgeStyles";

interface CreateTaskRowProps {
  bucketId: string;
  orderInBucket: number;
  onSave: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const CreateTaskRow = ({
  bucketId,
  orderInBucket,
  onSave,
  onCancel,
}: CreateTaskRowProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("not-started");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (!title.trim()) {
      setShowError(true);
      titleInputRef.current?.focus();
      return;
    }

    const newTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
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
      orderInBucket,
      userId: "user-1", // TODO: Replace with actual user ID
    };

    onSave(newTask);
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
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
      </div>

      {/* Cancel Button */}
      <div
        className="px-3 py-2.5 flex items-center justify-center border-r border-gray-100 min-h-[42px]"
        style={{ width: "40px", minWidth: "40px" }}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onCancel}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>

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
        className="px-3 py-2.5 flex items-center min-h-[42px]"
        style={{ width: "160px", minWidth: "160px" }}
      >
        <Input
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
    </div>
  );
};

export default CreateTaskRow;
