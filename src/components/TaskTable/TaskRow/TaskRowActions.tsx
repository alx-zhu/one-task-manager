import { MoreVertical, Trash2 } from "lucide-react";

interface TaskRowActionsProps {
  onDelete?: () => void;
  onMoreOptions?: () => void;
}

const TaskRowActions = ({ onDelete, onMoreOptions }: TaskRowActionsProps) => {
  return (
    <div className="opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-1 gap-1 bg-white/10 backdrop-blur-sm rounded shadow-sm">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="relative z-10 p-1.5 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoreOptions?.();
        }}
        className="relative z-10 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TaskRowActions;
