import { useState } from "react";
import { BucketSection } from "@/components/task-table";
import { mockBuckets } from "@/data/mockData";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TaskRowPreview } from "./components/task-table/TaskRowPreview";
import type { Task } from "./types/task";

function App() {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task: Task = event.active.data.current?.task;
    setDraggedTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      console.log(`Dragged item ${active.id} over ${over.id}`);
      // Implement logic to reorder tasks or move between buckets
    }
    setDraggedTask(null);
  };

  const handleDragCancel = () => {
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Task Pipeline
          </h1>
          <p className="text-gray-500 text-[0.95rem]">
            Focus on your ONE thing by prioritizing what matters most
          </p>
        </header>

        {/* Pipeline Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-medium text-gray-900">
            Priority Buckets
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-md font-medium transition-colors hover:bg-gray-50 hover:border-gray-300">
              + Add Column
            </button>
            <button className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-md font-medium transition-colors hover:bg-gray-50 hover:border-gray-300">
              Customize Buckets
            </button>
            <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md font-medium transition-colors hover:bg-gray-700">
              + Add Task
            </button>
          </div>
        </div>

        {/* Buckets */}
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div>
            {mockBuckets.map((bucket) => (
              <BucketSection
                key={bucket.id}
                bucket={bucket}
                onAddTask={() => console.log(`Add task to ${bucket.name}`)}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedTask ? <TaskRowPreview task={draggedTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
