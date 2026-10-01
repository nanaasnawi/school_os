'use client';

import React, { useState, useMemo } from 'react';
import styles from './data-table.module.css';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  keyExtractor: (item: T) => string;
  defaultPageSize?: number;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enablePagination?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data tidak ditemukan atau belum ditambahkan.',
  emptyAction,
  keyExtractor,
  defaultPageSize = 10,
  searchPlaceholder = 'Cari data...',
  enableSearch = true,
  enablePagination = true,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // 1. Filtered data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    return data.filter((item) => {
      return columns.some((col) => {
        const val = (item as Record<string, unknown>)[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, columns]);

  // 2. Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, direction } = sortConfig;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[key];
      const bVal = (b as Record<string, unknown>)[key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortConfig]);

  // 3. Paginated data
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, safeCurrentPage, pageSize, enablePagination]);

  const startEntry = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalEntries);

  const handleSort = (key: string, isSortable?: boolean) => {
    if (isSortable === false) return;
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  if (isLoading) {
    return (
      <div className={`${styles.tableCard} ${className}`}>
        <div className={styles.topBar}>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className={styles.tableContainer}>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                {columns.map((_, idx) => (
                  <Skeleton key={idx} className="h-7 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableCard} ${className}`}>
      {/* ── Top Bar: Showing Entries & Search Input ── */}
      <div className={styles.topBar}>
        <div className={styles.entriesInfo}>
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>

        {enableSearch && (
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        )}
      </div>

      {/* ── Main Data Table ── */}
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSortable = col.sortable !== false;
                  const isSorted = sortConfig?.key === col.key;
                  const direction = sortConfig?.direction;

                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, isSortable)}
                      className={`${isSortable ? styles.thSortable : ''} ${col.className || ''}`}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      <div className={styles.thContent}>
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className={styles.sortIcon} aria-label="Sort">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path
                                d="M8 9l4-4 4 4"
                                stroke={isSorted && direction === 'asc' ? '#009ef7' : '#94a3b8'}
                                strokeWidth={isSorted && direction === 'asc' ? '2.8' : '2'}
                              />
                              <path
                                d="M8 15l4 4 4-4"
                                stroke={isSorted && direction === 'desc' ? '#009ef7' : '#94a3b8'}
                                strokeWidth={isSorted && direction === 'desc' ? '2.8' : '2'}
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Tidak ada data yang cocok dengan pencarian "{searchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={keyExtractor(item)}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.className || ''}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bottom Bar: Page Size Selector & Pagination Controls ── */}
      {enablePagination && totalEntries > 0 && (
        <div className={styles.bottomBar}>
          <div className={styles.pageSizeWrapper}>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.pageSizeSelect}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className={styles.pageNavBtn}
            >
              Previous
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsisBefore && <span style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`${styles.pageBtn} ${p === safeCurrentPage ? styles.pageBtnActive : ''}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className={styles.pageNavBtn}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  label,
  variant,
}: {
  status?: string;
  label?: string;
  variant?: 'success' | 'muted' | 'warning' | 'danger' | 'info';
}) {
  let resolvedVariant = variant || 'muted';
  const text = label || status || '';
  const lower = text.toLowerCase();

  if (!variant) {
    if (['paid', 'active', 'aktif', 'lunas', 'selesai', 'graded', 'hadir'].includes(lower)) {
      resolvedVariant = 'success';
    } else if (['cancelled', 'batal', 'inactive', 'non-aktif', 'alpa'].includes(lower)) {
      resolvedVariant = 'muted';
    } else if (['pending', 'menunggu', 'unsubmitted', 'izin', 'sakit'].includes(lower)) {
      resolvedVariant = 'warning';
    } else if (['late', 'terlambat', 'remedial', 'failed', 'gagal'].includes(lower)) {
      resolvedVariant = 'danger';
    }
  }

  const variantClass = {
    success: styles.statusSuccess,
    muted: styles.statusMuted,
    warning: styles.statusWarning,
    danger: styles.statusDanger,
    info: styles.statusInfo,
  }[resolvedVariant];

  return <span className={`${styles.statusBadge} ${variantClass}`}>{text}</span>;
}
