import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Bucket } from "@/types/task";
import { cn } from "@/lib/utils";
import { useDeleteBucket } from "@/hooks/useBuckets";
import { BucketActionsCell } from "./BucketActionsCell";
import { toast } from "sonner";

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
  const [hasError, setHasError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { mutate: deleteBucket } = useDeleteBucket();

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const showError = (message: string) => {
    setHasError(true);
    toast.error(message);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showError("Bucket name is required");
      nameInputRef.current?.focus();
      return;
    }

    // Parse limit: empty string or "0" means no limit (undefined)
    const limitValue = limit.trim();
    const newLimit =
      limitValue && parseInt(limitValue) > 0 ? parseInt(limitValue) : undefined;

    // Validation: First bucket (isOneThing) must always have limit of 1
    if (bucket?.isOneThing && newLimit !== 1) {
      showError("The ONE Thing bucket must have a limit of 1");
      return;
    }

    // Validate limit against current task count
    if (bucket && newLimit !== undefined) {
      const currentTaskCount = bucket.tasks.length;
      if (newLimit < currentTaskCount) {
        showError(
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
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Chevron placeholder for alignment */}
        <span className="text-base leading-none text-transparent">▼</span>

        {/* Name Input */}
        <Input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (hasError) setHasError(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Bucket name"
          className={cn(
            "h-7 text-sm font-medium px-2 flex-1 min-w-[150px]",
            hasError && "border-red-500 focus-visible:ring-red-500",
            bucket?.isOneThing
              ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
              : "bg-white"
          )}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Limit Input */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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
              if (hasError) setHasError(false);
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
              hasError && "border-red-500 focus-visible:ring-red-500",
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
    </>
  );
}
