import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import type { Bucket } from "@/types/task";

interface BucketEditRowProps {
  bucket?: Bucket;
  onSave: (data: { name: string; limit?: number }) => void;
  onCancel: () => void;
}

export function BucketEditRow({
  bucket,
  onSave,
  onCancel,
}: BucketEditRowProps) {
  const [name, setName] = useState(bucket?.name || "");
  const [limit, setLimit] = useState(bucket?.limit?.toString() || "");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      setShowError(true);
      nameInputRef.current?.focus();
      return;
    }

    // Validate limit against current task count
    const newLimit = limit ? parseInt(limit) : undefined;
    if (bucket && newLimit !== undefined) {
      const currentTaskCount = bucket.tasks.length;
      if (newLimit < currentTaskCount) {
        setShowError(true);
        setErrorMessage(
          `Cannot set limit to ${newLimit}. This bucket has ${currentTaskCount} tasks. ` +
            `Please move ${currentTaskCount - newLimit} task${
              currentTaskCount - newLimit > 1 ? "s" : ""
            } first.`
        );
        return;
      }
    }

    onSave({
      name: name.trim(),
      limit: newLimit,
    });
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
    <div className="bg-blue-50/50 border-2 border-blue-400 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        {/* Name Input */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Bucket Name *
          </label>
          <Input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (showError && e.target.value.trim()) {
                setShowError(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={showError ? "Name is required" : "e.g., Important"}
            className={showError ? "border-red-500" : ""}
          />
        </div>

        {/* Limit Input */}
        <div className="w-32">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Limit
          </label>
          <Input
            type="number"
            min="0"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="No limit"
            className={showError ? "border-red-500" : ""}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-1 pb-0.5">
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            onClick={handleSave}
            title="Save (Enter)"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
            onClick={onCancel}
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {showError && errorMessage && (
        <div className="text-sm text-red-600 mt-2">{errorMessage}</div>
      )}
    </div>
  );
}
