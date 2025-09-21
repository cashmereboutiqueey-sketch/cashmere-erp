'use client';

import { Table } from '@tanstack/react-table';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  children: React.ReactNode;
}

export function DataTableToolbar<TData>({
  children,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">{children}</div>
    </div>
  );
}
