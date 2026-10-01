'use client';

import React, { useState, useMemo } from 'react';
import styles from './TeacherClassesView.module.css';
import { useTeacherClasses } from '../../hooks';
import type { ClassStudentDto } from '../../types';
import { DataTable, StatusBadge, Column } from '@/shared/ui/data-table';

export function TeacherClassesView() {
  const {
    classes,
    isLoadingClasses,
    selectedClassId,
    selectedClass,
    students,
    isLoadingStudents,
    studentStats,
    selectClass,
    refreshStudents,
  } = useTeacherClasses();

  const [activeStudentModal, setActiveStudentModal] = useState<ClassStudentDto | null>(null);

  // ── CSV Export Function ──
  const handleExportCSV = () => {
    if (!students || students.length === 0) return;

    const headers = ['No', 'NISN', 'Nama Peserta Didik', 'L/P', 'Status', 'No. HP', 'Email', 'Kelas'];
    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.nisn}"`,
      `"${s.full_name}"`,
      `"${s.gender || '-'}"`,
      `"${s.status}"`,
      `"${s.no_hp || '-'}"`,
      `"${s.email || '-'}"`,
      `"${s.class_name || selectedClass?.name || '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Roster_${selectedClass?.name || 'Kelas'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Print Attendance / Roster Sheet ──
  const handlePrintRoster = () => {
    window.print();
  };

  // ── Table Column Definitions (Strict Screenshot Fidelity) ──
  const columns: Column<ClassStudentDto>[] = useMemo(
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
        key: 'full_name',
        header: 'Nama Peserta Didik',
        sortable: true,
        render: (item) => {
          const initials = item.full_name
            ? item.full_name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()
            : 'S';

          return (
            <div className={styles.studentCell}>
              <div className={styles.studentAvatar}>{initials}</div>
              <div className={styles.studentDetails}>
                <span className={styles.studentName}>{item.full_name}</span>
                {item.email && <span className={styles.studentEmail}>{item.email}</span>}
              </div>
            </div>
          );
        },
      },
      {
        key: 'gender',
        header: 'L / P',
        sortable: true,
        align: 'center',
        render: (item) => {
          const g = item.gender?.toUpperCase() || '-';
          const isL = g === 'L' || g === 'LAKI-LAKI';
          const isP = g === 'P' || g === 'PEREMPUAN';

          if (isL) {
            return <span className={`${styles.genderBadge} ${styles.genderMale}`}>L</span>;
          }
          if (isP) {
            return <span className={`${styles.genderBadge} ${styles.genderFemale}`}>P</span>;
          }
          return <span style={{ color: '#94a3b8' }}>-</span>;
        },
      },
      {
        key: 'no_hp',
        header: 'Kontak / WhatsApp',
        sortable: false,
        render: (item) => {
          if (!item.no_hp || item.no_hp.trim().length < 5) {
            return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>;
          }

          let cleaned = item.no_hp.replace(/\D/g, '');
          if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.slice(1);
          }

          return (
            <a
              href={`https://wa.me/${cleaned}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.phoneLink}
              title="Kirim pesan WhatsApp"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{item.no_hp}</span>
            </a>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        align: 'center',
        render: (item) => {
          const lower = item.status?.toLowerCase() || '';
          const label = lower === 'active' || lower === 'aktif' ? 'Aktif' : (lower === 'inactive' ? 'Non-Aktif' : item.status);
          return <StatusBadge status={item.status} label={label} />;
        },
      },
      {
        key: 'actions',
        header: 'Aksi',
        sortable: false,
        align: 'right',
        render: (item) => (
          <button
            type="button"
            onClick={() => setActiveStudentModal(item)}
            className={styles.btnDetail}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Profil</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container}>
      {/* ── Top Header & Global Actions ── */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleSection}>
          <div className={styles.badgeHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Teacher Workstation • Phase 3
          </div>
          <h1 className={styles.title}>Kelas Saya &amp; Roster Siswa</h1>
          <p className={styles.subtitle}>
            Kelola data peserta didik, kontak wali/siswa, dan status rombel yang Anda bimbing.
          </p>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            onClick={handlePrintRoster}
            className={styles.btnAction}
            title="Cetak lembar roster & presensi rombel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak Presensi</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnAction}
            title="Unduh data roster siswa format CSV"
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
            onClick={() => refreshStudents()}
            className={`${styles.btnAction} ${styles.btnPrimary}`}
            title="Perbarui data roster"
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

      {/* ── Class Switcher Cards ── */}
      {isLoadingClasses ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          Memuat daftar rombongan belajar...
        </div>
      ) : (
        <div className={styles.classesGrid}>
          {classes.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            return (
              <div
                key={cls.id}
                onClick={() => selectClass(cls.id)}
                className={`${styles.classCard} ${isSelected ? styles.classCardActive : ''}`}
              >
                <div className={styles.classCardHeader}>
                  <span className={styles.classLevelBadge}>
                    {cls.grade_level_name || 'Rombel'}
                  </span>
                  {isSelected && (
                    <span className={styles.activeIndicator}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Dipilih
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={styles.className}>{cls.name}</h3>
                </div>

                <div className={styles.classFooter}>
                  <span>Total Siswa:</span>
                  <span className={styles.studentCountBadge}>
                    {cls.student_count > 0 ? `${cls.student_count} Siswa` : 'Terdata'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Stats Grid for Selected Class (Admin Dashboard Design) ── */}
      {selectedClass && (
        <div className={styles.metricsGrid}>
          {/* Card 1: Total Terdaftar */}
          <div className={`${styles.metricCard} ${styles.cardBlue}`}>
            <div className={styles.metricTop}>
              <div className={styles.metricInfo}>
                <div className={styles.metricValue}>{studentStats.total}</div>
                <div className={styles.metricSubtitle}>Peserta Didik Terdata</div>
              </div>
              <div className={styles.metricWatermark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
            </div>
            <div className={styles.metricBottom}>
              <span>Total Roster Siswa</span>
              <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Card 2: Siswa Aktif */}
          <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
            <div className={styles.metricTop}>
              <div className={styles.metricInfo}>
                <div className={styles.metricValue}>{studentStats.activeCount}</div>
                <div className={styles.metricSubtitle}>Status Pembelajaran Aktif</div>
              </div>
              <div className={styles.metricWatermark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
              </div>
            </div>
            <div className={styles.metricBottom}>
              <span>Siswa Aktif Terverifikasi</span>
              <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Card 3: Laki-laki */}
          <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
            <div className={styles.metricTop}>
              <div className={styles.metricInfo}>
                <div className={styles.metricValue}>{studentStats.maleCount}</div>
                <div className={styles.metricSubtitle}>Peserta Didik Pria</div>
              </div>
              <div className={styles.metricWatermark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className={styles.metricBottom}>
              <span>Laki-laki (L)</span>
              <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Card 4: Perempuan */}
          <div className={`${styles.metricCard} ${styles.cardPurple}`}>
            <div className={styles.metricTop}>
              <div className={styles.metricInfo}>
                <div className={styles.metricValue}>{studentStats.femaleCount}</div>
                <div className={styles.metricSubtitle}>Peserta Didik Wanita</div>
              </div>
              <div className={styles.metricWatermark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 11v6" />
                  <path d="M9 14h6" />
                </svg>
              </div>
            </div>
            <div className={styles.metricBottom}>
              <span>Perempuan (P)</span>
              <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Card 5: Kontak WA */}
          <div className={`${styles.metricCard} ${styles.cardTeal}`}>
            <div className={styles.metricTop}>
              <div className={styles.metricInfo}>
                <div className={styles.metricValue}>{studentStats.hasPhoneCount}</div>
                <div className={styles.metricSubtitle}>Nomor WhatsApp Terdata</div>
              </div>
              <div className={styles.metricWatermark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
            </div>
            <div className={styles.metricBottom}>
              <span>Kontak Wali / Siswa</span>
              <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Roster Table (Pixel-Perfect to Screenshot) ── */}
      <DataTable<ClassStudentDto>
        columns={columns}
        data={students}
        isLoading={isLoadingStudents}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Cari berdasarkan nama, NISN, atau no HP..."
        emptyTitle="Belum Ada Peserta Didik"
        emptyDescription={
          selectedClass
            ? `Belum ada data siswa yang terdaftar dalam rombel ${selectedClass.name}.`
            : 'Pilih rombel di atas untuk melihat daftar siswa.'
        }
        defaultPageSize={10}
      />

      {/* ── Student Profile Modal Drawer ── */}
      {activeStudentModal && (
        <div className={styles.modalBackdrop} onClick={() => setActiveStudentModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detail Peserta Didik</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveStudentModal(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalProfileHead}>
                <div className={styles.modalAvatarLarge}>
                  {activeStudentModal.full_name ? activeStudentModal.full_name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {activeStudentModal.full_name}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
                    <span className={styles.nisnBadge}>NISN: {activeStudentModal.nisn || '-'}</span>
                    <StatusBadge
                      status={activeStudentModal.status}
                      label={activeStudentModal.status === 'active' ? 'Aktif' : activeStudentModal.status}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoItemLabel}>Rombongan Belajar</span>
                  <span className={styles.infoItemVal}>
                    {activeStudentModal.class_name || selectedClass?.name || '-'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoItemLabel}>Jenis Kelamin</span>
                  <span className={styles.infoItemVal}>
                    {activeStudentModal.gender === 'L' || activeStudentModal.gender === 'LAKI-LAKI'
                      ? 'Laki-laki'
                      : activeStudentModal.gender === 'P' || activeStudentModal.gender === 'PEREMPUAN'
                      ? 'Perempuan'
                      : '-'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoItemLabel}>Nomor WhatsApp / HP</span>
                  <span className={styles.infoItemVal}>
                    {activeStudentModal.no_hp || 'Belum terdata'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoItemLabel}>Email Belajar.id</span>
                  <span className={styles.infoItemVal}>
                    {activeStudentModal.email || 'Belum terdata'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              {activeStudentModal.no_hp && (
                <a
                  href={`https://wa.me/${activeStudentModal.no_hp.replace(/\D/g, '').replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btnAction} ${styles.btnPrimary}`}
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Chat WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveStudentModal(null)}
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
