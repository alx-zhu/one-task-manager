import { MoreVertical, Copy, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
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
import type { Bucket } from "@/types/task";

interface TaskRowActionsProps {
  buckets: Bucket[];
  currentBucketId: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveTo?: (bucketId: string) => void;
}

const TaskRowActions = ({
  buckets,
  currentBucketId,
  onDelete,
  onDuplicate,
  onMoveTo,
}: TaskRowActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`${
        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      } hover:bg-white transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-1 gap-1 bg-white/10 backdrop-blur-sm rounded shadow-sm`}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="relative z-10 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRight className="w-4 h-4" />
              <span>Move to</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
                        onMoveTo?.(bucket.id);
                      }}
                      disabled={isFull}
                      className={
                        isFull ? "cursor-not-allowed" : "cursor-pointer"
                      }
                    >
                      {bucket.name}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
            className="cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskRowActions;
