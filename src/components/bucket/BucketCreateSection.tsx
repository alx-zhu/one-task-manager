import { BucketEditRow } from "./BucketEditRow";
import { TaskTable } from "@/components/table/TaskTable";
import { taskColumns } from "@/components/table/columns";

interface BucketCreateSectionProps {
  onSave: (data: { name: string; limit?: number }) => void;
  onCancel: () => void;
}

/**
 * Component for creating a new bucket
 * Shows an edit row and empty task table preview
 */
export function BucketCreateSection({
  onSave,
  onCancel,
}: BucketCreateSectionProps) {
  return (
    <div className="rounded-lg overflow-hidden mb-4 bg-white border-2 border-blue-400">
      <BucketEditRow onSave={onSave} onCancel={onCancel} />

      {/* Empty task table preview */}
      <div className="border-t border-gray-200">
        <div className="min-w-max">
          <TaskTable data={[]} columns={taskColumns} />
        </div>
      </div>

      {/* Add task placeholder */}
      <div className="flex p-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm px-2 py-1.5 text-gray-300">
          <span>Add task (save bucket first)</span>
        </div>
      </div>
    </div>
  );
}
