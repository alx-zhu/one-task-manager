import { useState, useMemo } from "react";
import type { Task } from "@/types/task";
import { completedTaskColumns } from "./columns";
import { TaskTable } from "./TaskTable";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskRow from "./row/TaskRow";

interface CompletedTasksSectionProps {
  tasks: Task[];
}

interface TimelineGroup {
  label: string;
  tasks: Task[];
}

// Group tasks by completion date
function groupTasksByTimeline(tasks: Task[]): TimelineGroup[] {
  const now = new Date();
  const groups: TimelineGroup[] = [
    { label: "Today", tasks: [] },
    { label: "Yesterday", tasks: [] },
    { label: "This Week", tasks: [] },
    { label: "Older", tasks: [] },
  ];

  tasks.forEach((task) => {
    if (!task.completedAt) return;

    const completed = new Date(task.completedAt);
    const diffMs = now.getTime() - completed.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      groups[0].tasks.push(task);
    } else if (diffDays === 1) {
      groups[1].tasks.push(task);
    } else if (diffDays < 7) {
      groups[2].tasks.push(task);
    } else {
      groups[3].tasks.push(task);
    }
  });

  // Filter out empty groups
  return groups.filter((group) => group.tasks.length > 0);
}

export function CompletedTasksSection({ tasks }: CompletedTasksSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Group tasks by timeline
  const timelineGroups = useMemo(() => groupTasksByTimeline(tasks), [tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden mb-4 bg-white border border-gray-200">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={cn(
              "text-base leading-none text-gray-400 transition-transform",
              isCollapsed && "-rotate-90"
            )}
          />
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-700">
              Completed Tasks
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
              {tasks.length}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">Last 7 days</div>
      </div>

      {/* Timeline Groups */}
      {!isCollapsed && (
        <div>
          {timelineGroups.map((group) => (
            <TimelineGroupSection
              key={group.label}
              label={group.label}
              tasks={group.tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TimelineGroupSectionProps {
  label: string;
  tasks: Task[];
}

function TimelineGroupSection({ label, tasks }: TimelineGroupSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Timeline Label */}
      <div className="px-5 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {label}
          </h4>
          <span className="text-xs text-gray-400">({tasks.length})</span>
        </div>
      </div>

      {/* Use TaskTable with custom row renderer */}
      <TaskTable
        data={tasks}
        columns={completedTaskColumns}
        enableSorting={false}
        renderRow={(row) => <TaskRow key={row.id} row={row} isCompleted />}
      />
    </div>
  );
}
