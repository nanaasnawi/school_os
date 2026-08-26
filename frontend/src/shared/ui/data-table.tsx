'use client';

import React from 'react';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data tidak ditemukan atau belum ditambahkan.',
  emptyAction,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full overflow-hidden border border-slate-800 rounded-xl bg-slate-900/50">
        <div className="p-4 border-b border-slate-800 flex gap-4">
          {columns.map((_, idx) => (
            <Skeleton key={idx} className="h-5 flex-1" />
          ))}
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              {columns.map((_, idx) => (
                <Skeleton key={idx} className="h-6 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/40">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="hover:bg-slate-800/40 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
