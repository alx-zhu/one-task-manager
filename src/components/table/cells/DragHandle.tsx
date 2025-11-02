export function DragHandle() {
  return (
    <div className="flex items-center justify-center group" data-drag-handle>
      <span className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing text-base leading-none transition-colors duration-150">
        ⋮⋮
      </span>
    </div>
  );
}
