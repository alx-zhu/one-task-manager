import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { Bucket } from "@/types/task";
import { cn } from "@/lib/utils";
import { useDeleteBucket } from "@/hooks/useBuckets";
import { BucketActionsCell } from "./BucketActionsCell";

interface BucketEditRowProps {
  bucket?: Bucket;
  onSave: (data: { name: string; limit?: number }) => void;
  onCancel: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: (bucketId: string) => void;
  onMoveDown?: (bucketId: string) => void;
}

export function BucketEditRow({
  bucket,
  onSave,
  onCancel,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: BucketEditRowProps) {
  const [name, setName] = useState(bucket?.name || "");
  const [limit, setLimit] = useState(bucket?.limit?.toString() || "");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const { mutate: deleteBucket } = useDeleteBucket();

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      setShowError(true);
      setErrorMessage("Bucket name is required");
      nameInputRef.current?.focus();
      return;
    }

    // Parse limit: empty string or "0" means no limit (undefined)
    const limitValue = limit.trim();
    const newLimit =
      limitValue && parseInt(limitValue) > 0 ? parseInt(limitValue) : undefined;

    // Validation: First bucket (isOneThing) must always have limit of 1
    if (bucket?.isOneThing && newLimit !== 1) {
      setShowError(true);
      setErrorMessage("The ONE Thing bucket must have a limit of 1");
      return;
    }

    // Validate limit against current task count
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

  const handleDeleteBucket = () => {
    if (!bucket) return;

    if (
      window.confirm(
        `Are you sure you want to delete "${bucket.name}"? This action cannot be undone.`
      )
    ) {
      deleteBucket(bucket.id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-3 border-b border-gray-200 relative",
        bucket?.isOneThing
          ? "bg-gray-900 text-white"
          : "bg-blue-50 border-b-blue-400"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Chevron placeholder for alignment */}
        <span className="text-base leading-none text-transparent">▼</span>

        {/* Name Input */}
        <Input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (showError && e.target.value.trim()) {
              setShowError(false);
              setErrorMessage("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Bucket name"
          className={cn(
            "h-7 text-sm font-medium px-2 flex-1 min-w-[150px]",
            showError && "border-red-500 focus-visible:ring-red-500",
            bucket?.isOneThing
              ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
              : "bg-white"
          )}
        />

        {/* Limit Input */}
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs",
              bucket?.isOneThing ? "text-white/70" : "text-gray-500"
            )}
          >
            Limit:
          </span>
          <Input
            type="number"
            min="0"
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              if (showError) {
                setShowError(false);
                setErrorMessage("");
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="∞"
            title={
              bucket?.isOneThing
                ? "The ONE Thing bucket must have a limit of 1"
                : "Leave empty or set to 0 for no limit"
            }
            disabled={bucket?.isOneThing}
            className={cn(
              "h-7 w-16 text-sm px-2 text-center",
              showError && "border-red-500 focus-visible:ring-red-500",
              bucket?.isOneThing
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/50 cursor-not-allowed opacity-60"
                : "bg-white"
            )}
          />
        </div>
      </div>

      {/* Action Buttons - always shown in edit mode */}
      <BucketActionsCell
        mode="edit"
        bucket={bucket}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onSave={handleSave}
        onCancel={onCancel}
        onDelete={bucket ? handleDeleteBucket : undefined}
      />

      {/* Error Message Tooltip */}
      {showError && errorMessage && (
        <div
          className={cn(
            "absolute left-5 right-5 top-[90%] mt-1 px-3 py-2 rounded shadow-lg text-sm z-10 flex items-center justify-between bg-red-50 text-red-600 border border-red-200"
          )}
        >
          {errorMessage}
          <button
            className="text-gray-400 hover:text-red-600 cursor-pointer"
            onClick={() => setShowError(false)}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-red-600 cursor-pointer" />
          </button>
        </div>
      )}
    </div>
  );
}
