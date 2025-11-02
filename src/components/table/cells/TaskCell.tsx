interface TaskCellProps {
  title: string;
  description?: string;
}

export function TaskCell({ title, description }: TaskCellProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 w-full">
      <div className="text-sm text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
        {title}
      </div>
      {description && (
        <div className="text-xs text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
          {description}
        </div>
      )}
    </div>
  );
}
