# Task Pipeline - React Implementation

This is a modular implementation of the task prioritization pipeline using React, TypeScript, Tailwind CSS, and TanStack Table.

## Project Structure

```
src/
├── types/
│   └── task.ts                    # TypeScript interfaces for Task and Bucket
├── components/
│   └── task-table/
│       ├── index.ts               # Barrel export for all components
│       ├── columns.tsx            # Column definitions for TanStack Table
│       ├── TaskTable.tsx          # Main table component
│       ├── BucketSection.tsx      # Collapsible bucket wrapper
│       ├── DragHandle.tsx         # Drag handle cell component
│       ├── TaskCheckbox.tsx       # Checkbox cell component
│       ├── TaskCell.tsx           # Task title/description cell
│       ├── StatusBadge.tsx        # Status badge component
│       ├── PriorityBadge.tsx      # Priority badge component
│       ├── DueDateCell.tsx        # Due date cell with conditional styling
│       └── TagsCell.tsx           # Tags display component
├── data/
│   └── mockData.ts                # Mock data for testing
└── App.tsx                        # Example usage
```

## Key Design Decisions

### 1. Separation of Concerns
- **Types** (`types/task.ts`): Domain models separate from UI
- **Column Definitions** (`columns.tsx`): Presentation logic separate from data
- **Cell Components**: Each column type has its own component for reusability

### 2. TanStack Table Integration
The `TaskTable` component uses TanStack Table's headless approach:
- Manages table state and logic
- You control all HTML/CSS
- Column definitions are type-safe and extensible

### 3. Component Modularity
Each cell type is a separate component, making it easy to:
- Modify individual column rendering
- Add new column types
- Reuse components elsewhere in the app

## Usage Examples

### Basic Usage (as shown in App.tsx)

```tsx
import { BucketSection } from '@/components/task-table';
import { mockBuckets } from '@/data/mockData';

function MyComponent() {
  return (
    <div>
      {mockBuckets.map((bucket) => (
        <BucketSection 
          key={bucket.id} 
          bucket={bucket}
          onAddTask={() => handleAddTask(bucket.id)}
        />
      ))}
    </div>
  );
}
```

### Using TaskTable Directly

```tsx
import { TaskTable, taskColumns } from '@/components/task-table';
import { Task } from '@/types/task';

function MyTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <TaskTable 
      data={tasks}
      columns={taskColumns}
      onAddTask={() => console.log('Add task')}
    />
  );
}
```

### Customizing Columns

To add a new column or modify existing ones:

```tsx
// In columns.tsx or create your own column definition
import { ColumnDef } from '@tanstack/react-table';
import { Task } from '@/types/task';

export const customColumns: ColumnDef<Task>[] = [
  ...taskColumns,
  {
    id: 'assignee',
    header: 'Assignee',
    size: 120,
    cell: ({ row }) => <span>{row.original.assignee?.name}</span>,
  },
];

// Then use it
<TaskTable data={tasks} columns={customColumns} />
```

### Creating Custom Cell Components

```tsx
// components/task-table/MyCustomCell.tsx
interface MyCustomCellProps {
  value: string;
}

export function MyCustomCell({ value }: MyCustomCellProps) {
  return (
    <div className="text-sm text-gray-900">
      {value}
    </div>
  );
}

// Add to columns.tsx
{
  id: 'custom',
  header: 'Custom',
  accessorKey: 'customField',
  size: 100,
  cell: ({ row }) => <MyCustomCell value={row.original.customField} />
}
```

## Required Dependencies

Make sure you have these installed:

```bash
npm install @tanstack/react-table date-fns
```

## Styling Notes

### Tailwind Configuration
The design uses standard Tailwind classes. Make sure your `tailwind.config.js` includes:

```js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of config
}
```

### Column Widths
Column widths are controlled via the `size` property in column definitions:
- Fixed width columns: `size: 120` (in pixels)
- Flexible column (task): `flex: 1` in the render logic

## Component Props

### BucketSection
```tsx
interface BucketSectionProps {
  bucket: Bucket;           // Bucket data with tasks
  onAddTask?: () => void;   // Callback for add task button
}
```

### TaskTable
```tsx
interface TaskTableProps {
  data: Task[];                    // Array of tasks to display
  columns: ColumnDef<Task>[];      // Column definitions
  onAddTask?: () => void;          // Optional add task callback
}
```

## Next Steps

### To Add Drag-and-Drop:
1. Install `@dnd-kit/core` and `@dnd-kit/sortable`
2. Wrap `TaskTable` rows with `useSortable` hook
3. Add drop zones between buckets

### To Add Inline Editing:
1. Add click handlers to cells
2. Show input fields on edit mode
3. Save changes on blur or Enter key

### To Add Column Customization:
1. Create a column visibility state
2. Add a dropdown menu in table header
3. Filter `columns` array based on visibility state

## Mock Data

The `mockData.ts` file includes realistic sample data for:
- 10 sample tasks with various statuses, priorities, and due dates
- 5 buckets (The ONE Thing, Time-Sensitive, Important, When Available, Someday/Maybe)

Use this for testing and development.
