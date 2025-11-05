import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  MoreVertical,
  Trash2,
  Save,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Bucket } from "@/types/task";
import { Button } from "../ui/button";

interface BucketActionsCellProps {
  mode: "display" | "edit";
  bucket?: Bucket; // Make bucket optional for new bucket creation
  // Display mode props
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: (bucketId: string) => void;
  onMoveDown?: (bucketId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  // Edit mode props
  onSave?: () => void;
  onCancel?: () => void;
}

export function BucketActionsCell({
  mode,
  bucket,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: BucketActionsCellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getMenuClass = (disabled = false) => {
    return cn(
      "h-7 w-7 flex items-center justify-center rounded transition-colors",
      disabled
        ? bucket?.isOneThing
          ? "text-white/20 cursor-not-allowed"
          : "text-gray-200 cursor-not-allowed"
        : bucket?.isOneThing
        ? "text-white/70 hover:text-white hover:bg-white/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 group-hover/bucket:opacity-100 transition-opacity duration-200",
        mode === "edit" && "ml-2",
        (isMenuOpen || mode === "edit") && "opacity-100"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Move Up/Down buttons - always shown when not isOneThing */}
      {bucket && !bucket.isOneThing && (
        <>
          <button
            className={getMenuClass(isFirst)}
            onClick={() => onMoveUp?.(bucket.id)}
            disabled={isFirst}
            title="Move bucket up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            className={getMenuClass(isLast)}
            onClick={() => onMoveDown?.(bucket.id)}
            disabled={isLast}
            title="Move bucket down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Conditional: Edit mode shows Save/Cancel, Display mode shows Edit + Menu */}
      {mode === "edit" ? (
        <>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn(
              "h-7 w-7",
              bucket?.isOneThing
                ? "text-green-400 hover:text-green-300 hover:bg-white/10"
                : "text-green-600 hover:text-green-700 hover:bg-green-100"
            )}
            onClick={onSave}
            title="Save (Enter)"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn(
              "h-7 w-7",
              bucket?.isOneThing
                ? "text-red-400 hover:text-red-300 hover:bg-white/10"
                : "text-red-600 hover:text-red-700 hover:bg-red-100"
            )}
            onClick={onCancel}
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <button
            className={getMenuClass()}
            onClick={onEdit}
            title="Edit bucket"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* More Options Dropdown - only shown in display mode */}
          {bucket && !bucket.isOneThing && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={getMenuClass()}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 p-1.5 border-gray-200 shadow-lg"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  variant="destructive"
                  className="rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}
