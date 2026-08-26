'use client';

import React from 'react';
import styles from './DataTable.module.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className={styles.skeletonRow}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className={styles.td}>
          <span className={`${styles.skeletonCell} skeleton`} style={{ width: `${55 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  meta,
  onPageChange,
  isLoading = false,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const totalPages = meta?.total_pages ?? 1;
  const currentPage = meta?.page ?? 1;

  const pageNumbers = (): (number | '...')[] => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              {columns.map((col) => (
                <th key={col.key} className={styles.th}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={columns.length} />
                ))
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <svg viewBox="0 0 48 48" fill="none" width="40" height="40">
                        <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 20h16M16 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span>{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              )
              : data.map((item, rowIdx) => (
                <tr key={(item as { id?: string | number }).id ?? rowIdx} className={styles.row}>
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {meta.total_items.toLocaleString()} total records
          </span>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              aria-label="Previous page"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>

            {pageNumbers().map((p, i) =>
              p === '...'
                ? <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                    onClick={() => onPageChange?.(p as number)}
                  >
                    {p}
                  </button>
                )
            )}

            <button
              className={styles.pageBtn}
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              aria-label="Next page"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
                <path d="M6 12l4-4-4-4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
