'use client';

import React, { useState, useMemo } from 'react';
import styles from './TeacherAnalyticsView.module.css';
import { useTeacherAnalytics } from '../../hooks';
import type { StudentReadingProgressRow } from '../../types';
import { DataTable, StatusBadge, Column } from '@/shared/ui/data-table';

export function TeacherAnalyticsView() {
  const {
    materials,
    filteredRows,
    metrics,
    isLoading,
    availableClasses,
    selectedMaterialId,
    setSelectedMaterialId,
    selectedClassFilter,
    setSelectedClassFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    refresh,
  } = useTeacherAnalytics();

  const [activeModalRow, setActiveModalRow] = useState<StudentReadingProgressRow | null>(null);

  // ── CSV Export Function ──
  const handleExportCSV = () => {
    if (!filteredRows || filteredRows.length === 0) return;

    const headers = ['No', 'NISN', 'Nama Siswa', 'Rombel', 'Materi/Buku', 'Halaman Dibaca', 'Total Halaman', 'Progress (%)', 'Status', 'Terakhir Dibaca'];
    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      `"${r.nisn || '-'}"`,
      `"${r.student_name}"`,
      `"${r.class_name}"`,
      `"${r.material_title}"`,
      r.current_page,
      r.total_pages,
      `${r.completion_percentage}%`,
      r.is_completed ? 'Selesai' : r.current_page > 1 ? 'Sedang Baca' : 'Belum Mulai',
      `"${r.last_read_at ? new Date(r.last_read_at).toLocaleDateString('id-ID') : '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Reading_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Column Definitions (Strict Screenshot Alignment) ──
  const columns: Column<StudentReadingProgressRow>[] = useMemo(
    () => [
      {
        key: 'nisn',
        header: 'NISN',
        sortable: true,
        render: (item) => (
          <span className={styles.nisnBadge}>
            {item.nisn || '-'}
          </span>
        ),
      },
      {
        key: 'student_name',
        header: 'Nama Peserta Didik',
        sortable: true,
        render: (item) => (
          <span className={styles.studentName}>{item.student_name}</span>
        ),
      },
      {
        key: 'class_name',
        header: 'Rombongan Belajar',
        sortable: true,
        render: (item) => (
          <span className={styles.classBadge}>
            {item.class_name || 'Umum'}
          </span>
        ),
      },
      {
        key: 'material_title',
        header: 'Materi / Buku Bacaan',
        sortable: true,
        render: (item) => (
          <div style={{ maxWidth: '260px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.material_title}>
              {item.material_title}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {item.subject_name || 'Bahan Ajar'}
            </div>
          </div>
        ),
      },
      {
        key: 'completion_percentage',
        header: 'Progress Membaca',
        sortable: true,
        render: (item) => (
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: item.is_completed ? '#16a34a' : '#0284c7' }}>
              {item.current_page} / {item.total_pages} hlm ({item.completion_percentage}%)
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={`${styles.progressBarFill} ${item.is_completed ? styles.progressCompleted : styles.progressInProgress}`}
                style={{ width: `${Math.min(100, item.completion_percentage)}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'reading_status',
        header: 'Status',
        sortable: true,
        align: 'center',
        render: (item) => {
          if (item.is_completed) {
            return <StatusBadge status="Paid" label="Selesai" />;
          }
          if (item.current_page > 1) {
            return <StatusBadge status="Pending" label="Sedang Baca" />;
          }
          return <StatusBadge status="Cancelled" label="Belum Mulai" />;
        },
      },
      {
        key: 'last_read_at',
        header: 'Terakhir Dibaca',
        sortable: true,
        render: (item) => (
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {item.last_read_at
              ? new Date(item.last_read_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        sortable: false,
        align: 'right',
        render: (item) => (
          <button
            type="button"
            onClick={() => setActiveModalRow(item)}
            className={styles.btnAction}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <span>Detail</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container}>
      {/* ── Top Header ── */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleSection}>
          <div className={styles.badgeHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Teacher Workstation
          </div>
          <h1 className={styles.title}>Teacher Analytics &amp; Reading Progress</h1>
          <p className={styles.subtitle}>
            Monitoring keterbacaan materi, halaman yang dibaca siswa, dan capaian literasi digital per rombel.
          </p>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnAction}
            title="Unduh rekapitulasi analitik membaca dalam format CSV"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => refresh()}
            className={`${styles.btnAction} ${styles.btnPrimary}`}
            title="Perbarui data analitik"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Summary Cards ── */}
      {/* ── KPI Metric Summary Cards (Admin Dashboard Design) ── */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Total Materi */}
        <div className={`${styles.metricCard} ${styles.cardPurple}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_materials}</div>
              <div className={styles.metricSubtitle}>Materi &amp; Modul Terbit</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Total Modul Bacaan</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 2: Pembaca Terdata */}
        <div className={`${styles.metricCard} ${styles.cardBlue}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_readers}</div>
              <div className={styles.metricSubtitle}>Siswa Aktif Membaca</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Peserta Didik Terdata</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 3: Ketercapaian Baca */}
        <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.overall_completion_rate}%</div>
              <div className={styles.metricSubtitle}>{metrics.completed_readers} Siswa Tuntas Membaca</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Tingkat Ketercapaian</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 4: Total Halaman Dibaca */}
        <div className={`${styles.metricCard} ${styles.cardAmber}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_pages_read}</div>
              <div className={styles.metricSubtitle}>Halaman Digital Kumulatif</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Total Lembar Dibaca</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterItem}>
            <span>Rombel:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">Semua Rombel</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <span>Materi:</span>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className={styles.filterSelect}
              style={{ maxWidth: '280px' }}
            >
              <option value="ALL">Semua Materi / Buku</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.statusPills}>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`${styles.statusPillBtn} ${selectedStatusFilter === 'ALL' ? styles.statusPillBtnActive : ''}`}
          >
            Semua ({filteredRows.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('COMPLETED')}
            className={`${styles.statusPillBtn} ${selectedStatusFilter === 'COMPLETED' ? styles.statusPillBtnActive : ''}`}
          >
            Selesai ({filteredRows.filter((r) => r.is_completed).length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('IN_PROGRESS')}
            className={`${styles.statusPillBtn} ${selectedStatusFilter === 'IN_PROGRESS' ? styles.statusPillBtnActive : ''}`}
          >
            Sedang Baca ({filteredRows.filter((r) => !r.is_completed && r.current_page > 1).length})
          </button>
        </div>
      </div>

      {/* ── Screenshot-Exact Reading Analytics DataTable ── */}
      <DataTable<StudentReadingProgressRow>
        columns={columns}
        data={filteredRows}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Cari siswa, NISN, atau judul materi..."
        emptyTitle="Belum Ada Log Aktivitas Membaca"
        emptyDescription="Data progres membaca siswa dari materi ini belum terekam atau belum dimulai oleh peserta didik."
        defaultPageSize={10}
      />

      {/* ── Student Reading Detail Modal ── */}
      {activeModalRow && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModalRow(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detail Capaian Membaca</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModalRow(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeModalRow.student_name}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center' }}>
                  <span className={styles.nisnBadge}>NISN: {activeModalRow.nisn || '-'}</span>
                  <span className={styles.classBadge}>{activeModalRow.class_name}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Judul Buku / Materi</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                    {activeModalRow.material_title}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Halaman Terakhir</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Hal. {activeModalRow.current_page} dari {activeModalRow.total_pages}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Status Capaian</div>
                    <div style={{ marginTop: '0.2rem' }}>
                      {activeModalRow.is_completed ? (
                        <StatusBadge status="Paid" label="Tuntas Dibaca" />
                      ) : (
                        <StatusBadge status="Pending" label="Sedang Dibaca" />
                      )}
                    </div>
                  </div>
                </div>

                {activeModalRow.last_read_at && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Waktu Terakhir Membaca</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      {new Date(activeModalRow.last_read_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setActiveModalRow(null)}
                className={styles.btnAction}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
