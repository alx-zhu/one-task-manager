import { format, isToday, isPast, isYesterday } from "date-fns";

interface DateCellProps {
  date?: Date;
  isCompletedDate?: boolean;
}

function DueDateCell({ date }: DateCellProps) {
  // Handle due date display
  if (!date) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const isOverdue = isPast(date) && !isToday(date);
  const isTodayDate = isToday(date);

  let className = "text-sm text-gray-600";
  let displayText = format(date, "MMM d");

  if (isOverdue) {
    className = "text-sm text-red-600 font-medium";
    displayText = format(date, "MMM d") + " (overdue)";
  } else if (isTodayDate) {
    className = "text-sm text-orange-600 font-medium";
    displayText = "Today, " + format(date, "h:mm a");
  }

  return <span className={className}>{displayText}</span>;
}

function CompletedDateCell({ date }: DateCellProps) {
  if (!date) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const isTodayDate = isToday(date);
  const isYesterdayDate = isYesterday(date);

  const className = "text-sm text-green-600 font-medium";
  let displayText = "";

  if (isTodayDate) {
    displayText = format(date, "h:mm a");
  } else if (isYesterdayDate) {
    displayText = "Yesterday";
  } else {
    displayText = format(date, "MMM d, yyyy");
  }

  return <span className={className}>✓ {displayText}</span>;
}

export function DateCell({ date, isCompletedDate = false }: DateCellProps) {
  // Handle completed date display
  if (isCompletedDate) {
    return <CompletedDateCell date={date} />;
  }

  return <DueDateCell date={date} />;
}
