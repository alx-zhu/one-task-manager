interface TagsCellProps {
  tags: string[];
}

export function TagsCell({ tags }: TagsCellProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <span 
          key={tag}
          className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[0.7rem] whitespace-nowrap"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
