import { useState } from "react";
import type { Bucket } from "@/types/task";
import { TaskTable } from "./TaskTable";
import { taskColumns } from "./columns";
import { AnimatePresence, motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";

interface BucketSectionProps {
  bucket: Bucket;
  onAddTask?: () => void;
}

export function BucketSection({ bucket, onAddTask }: BucketSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(bucket.collapsed);

  const { setNodeRef } = useDroppable({
    id: bucket.id,
    data: { type: "bucket", bucket },
  });

  const getBucketCountClass = () => {
    if (!bucket.limit) {
      return "bg-gray-100 text-gray-600";
    }

    if (bucket.tasks.length >= bucket.limit) {
      return "bg-red-200 text-red-800";
    }

    if (bucket.tasks.length >= bucket.limit - 1) {
      return "bg-yellow-100 text-yellow-800";
    }

    return "bg-gray-100 text-gray-600";
  };

  const getContainerClass = () => {
    if (bucket.isOneThing) {
      return "bg-white border-2 border-gray-900 rounded-lg overflow-hidden mb-8";
    }
    return "bg-white border border-gray-200 rounded-lg overflow-hidden mb-4";
  };

  const getHeaderClass = () => {
    if (bucket.isOneThing) {
      return "flex items-center justify-between px-5 py-4 cursor-pointer select-none transition-colors bg-gray-900 text-white hover:bg-gray-800 border-b border-gray-700";
    }
    return "flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors hover:bg-gray-50 border-b border-gray-200";
  };

  const getChevronClass = () => {
    const baseClass = "text-base leading-none transition-transform";
    const colorClass = bucket.isOneThing ? "text-white/70" : "text-gray-400";
    const rotationClass = isCollapsed ? "-rotate-90" : "";
    return `${baseClass} ${colorClass} ${rotationClass}`;
  };

  const getCountClass = () => {
    if (bucket.isOneThing) {
      return `px-2 py-0.5 rounded-xl text-xs font-medium bg-white/20 text-white`;
    }
    return `px-2 py-0.5 rounded-xl text-xs font-medium ${getBucketCountClass()}`;
  };

  const getMenuClass = () => {
    if (bucket.isOneThing) {
      return "text-xl leading-none cursor-pointer p-1 text-white/70 hover:text-white";
    }
    return "text-xl leading-none cursor-pointer p-1 text-gray-400 hover:text-gray-600";
  };

  return (
    <div ref={setNodeRef} className={getContainerClass()}>
      {/* Bucket Header */}
      <div
        className={getHeaderClass()}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={getChevronClass()}>▼</span>
          <span className="font-medium text-sm">{bucket.name}</span>
          <span className={getCountClass()}>
            {bucket.tasks.length}
            {bucket.limit && `/${bucket.limit}`}
          </span>
        </div>
        <span
          className={getMenuClass()}
          onClick={(e) => {
            e.stopPropagation();
            // Handle menu click
          }}
        >
          ⋮
        </span>
      </div>

      {/* Table Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TaskTable
              data={bucket.tasks}
              columns={taskColumns}
              onAddTask={onAddTask}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
