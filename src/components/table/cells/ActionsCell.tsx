import {
  MoreVertical,
  Copy,
  Trash2,
  ArrowRight,
  Check,
  X,
  Save,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bucket, TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";

interface ActionsCellProps {
  mode: "display" | "edit";
  // Display mode props
  buckets?: Bucket[];
  currentBucketId?: string;
  currentStatus?: TaskStatus;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveTo?: (bucketId: string) => void;
  onToggleComplete?: () => void;
  // Edit mode props
  onSave?: () => void;
  onCancel?: () => void;
}

const ActionsCell = ({
  mode,
  buckets = [],
  currentBucketId = "",
  currentStatus = "not-started",
  onDelete,
  onDuplicate,
  onMoveTo,
  onToggleComplete,
  onSave,
  onCancel,
}: ActionsCellProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Edit Mode: Save and Cancel buttons
  if (mode === "edit") {
    return (
      <div className="flex items-center justify-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          title="Save (Enter)"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onCancel?.();
          }}
          title="Cancel (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Display Mode: Quick complete + dropdown menu
  const isCompleted = currentStatus === "completed";

  return (
    <div
      className={cn(
        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-200 flex items-center justify-center gap-1"
      )}
    >
      {/* Quick Complete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete?.();
        }}
        className={`p-1.5 rounded transition-colors ${
          isCompleted
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "text-gray-500 hover:bg-green-100 hover:text-green-600"
        }`}
        title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
      >
        <Check className="w-4 h-4" />
      </button>

      {/* More Options Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 p-1.5 border-gray-200 shadow-lg"
        >
          {onMoveTo && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                onClick={(e) => e.stopPropagation()}
                className="rounded px-2 py-1.5 text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Move to</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1.5 border-gray-200 shadow-lg">
                {buckets
                  .filter((bucket) => bucket.id !== currentBucketId)
                  .map((bucket) => {
                    const isFull =
                      !!bucket.limit && bucket.tasks.length >= bucket.limit;
                    return (
                      <DropdownMenuItem
                        key={bucket.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isFull) {
                            onMoveTo?.(bucket.id);
                          }
                        }}
                        disabled={isFull}
                        className={`rounded px-2 py-1.5 text-sm transition-colors relative pr-14 ${
                          isFull
                            ? "cursor-not-allowed text-gray-400"
                            : "cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                        }`}
                      >
                        <span className="truncate">{bucket.name}</span>
                        {isFull && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 whitespace-nowrap">
                            Full
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {onDuplicate && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
              className="rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>
          )}

          {(onMoveTo || onDuplicate) && (
            <DropdownMenuSeparator className="my-1 bg-gray-200" />
          )}

          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ActionsCell;
