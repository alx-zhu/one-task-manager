import { format, isToday, isPast } from 'date-fns';

interface DueDateCellProps {
  date?: Date;
}

export function DueDateCell({ date }: DueDateCellProps) {
  if (!date) {
    return <span className="text-sm text-gray-600">—</span>;
  }

  const isOverdue = isPast(date) && !isToday(date);
  const isTodayDate = isToday(date);

  let className = 'text-sm text-gray-600';
  let displayText = format(date, 'MMM d');

  if (isOverdue) {
    className = 'text-sm text-red-600 font-medium';
    displayText = format(date, 'MMM d') + ' (overdue)';
  } else if (isTodayDate) {
    className = 'text-sm text-orange-600 font-medium';
    displayText = 'Today, ' + format(date, 'h:mm a');
  }

  return <span className={className}>{displayText}</span>;
}
