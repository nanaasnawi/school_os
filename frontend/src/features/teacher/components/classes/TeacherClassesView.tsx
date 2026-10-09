'use client';

import React, { useState, useMemo } from 'react';
import styles from './TeacherClassesView.module.css';
import { useTeacherClasses } from '../../hooks';
import type { ClassStudentDto } from '../../types';
import { DataTable, StatusBadge, Column } from '@/shared/ui/data-table';
import { ClassCardsSkeleton } from '../shared';
import {
  Printer,
  Download,
  RotateCw,
  Users,
  UserCheck,
  User,
  Phone,
  MessageSquare,
  Check,
  Eye,
  X,
} from 'lucide-react';

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

  // ── Table Column Definitions ──
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
        render: (item) => (
          <div className={styles.studentDetails}>
            <span className={styles.studentName}>{item.full_name}</span>
            {item.email && <span className={styles.studentEmail}>{item.email}</span>}
          </div>
        ),
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
          return <span style={{ color: 'var(--text-muted, #94a3b8)' }}>-</span>;
        },
      },
      {
        key: 'no_hp',
        header: 'Kontak / WhatsApp',
        sortable: false,
        render: (item) => {
          if (!item.no_hp || item.no_hp.trim().length < 5) {
            return <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.78rem' }}>-</span>;
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
              <MessageSquare size={13} />
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
            <Eye size={12} />
            <span>Profil</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container}>
      {/* ── Top Header Card (Consistent with Learning & Workstation Design System) ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <Users size={18} />
          </div>
          <div className={styles.headerTextGroup}>
            <h1 className={styles.headerTitle}>Kelas Saya &amp; Roster Siswa</h1>
            <p className={styles.headerSubtitle}>
              Kelola data peserta didik, kontak wali/siswa, dan status rombel yang Anda bimbing.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handlePrintRoster}
            className={styles.btnSecondary}
            title="Cetak lembar roster & presensi rombel"
          >
            <Printer size={13} />
            <span>Cetak Presensi</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnSecondary}
            title="Unduh data roster siswa format CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => refreshStudents()}
            className={styles.btnPrimary}
            title="Perbarui data roster"
          >
            <RotateCw size={13} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── Class Switcher Cards (Refined Compact Grid) ── */}
      {isLoadingClasses ? (
        <ClassCardsSkeleton />
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
                  <span
                    className={`${styles.classLevelBadge} ${
                      cls.subject_name?.includes('Wali Kelas') ? styles.homeroomBadge : ''
                    }`}
                  >
                    {cls.subject_name || cls.grade_level_name || 'Rombel'}
                  </span>
                  {isSelected && (
                    <span className={styles.activeIndicator}>
                      <Check size={12} strokeWidth={2.8} />
                      <span>Dipilih</span>
                    </span>
                  )}
                </div>

                <h3 className={styles.className}>{cls.name}</h3>

                <div className={styles.classFooter}>
                  <span className={styles.classFooterLabel}>Total Siswa:</span>
                  <span className={styles.studentCountBadge}>
                    {cls.student_count > 0 ? `${cls.student_count} Siswa` : 'Terdata'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Stats Grid for Selected Class (Compact 13px Scale, 5 Columns) ── */}
      {selectedClass && (
        <div className={styles.metricsGrid}>
          {/* Card 1: Total Terdaftar */}
          <div className={`${styles.metricCard} ${styles.cardBlue}`}>
            <div className={styles.metricTopRow}>
              <span className={styles.metricLabel}>Total Roster Siswa</span>
              <div className={styles.metricIconBox}>
                <Users size={13} />
              </div>
            </div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{studentStats.total}</span>
              <span className={styles.metricSubtext}>Peserta Didik</span>
            </div>
          </div>

          {/* Card 2: Siswa Aktif */}
          <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
            <div className={styles.metricTopRow}>
              <span className={styles.metricLabel}>Siswa Aktif</span>
              <div className={styles.metricIconBox}>
                <UserCheck size={13} />
              </div>
            </div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{studentStats.activeCount}</span>
              <span className={styles.metricSubtext}>Terverifikasi</span>
            </div>
          </div>

          {/* Card 3: Laki-laki */}
          <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
            <div className={styles.metricTopRow}>
              <span className={styles.metricLabel}>Laki-laki (L)</span>
              <div className={styles.metricIconBox}>
                <User size={13} />
              </div>
            </div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{studentStats.maleCount}</span>
              <span className={styles.metricSubtext}>Peserta Pria</span>
            </div>
          </div>

          {/* Card 4: Perempuan */}
          <div className={`${styles.metricCard} ${styles.cardPink}`}>
            <div className={styles.metricTopRow}>
              <span className={styles.metricLabel}>Perempuan (P)</span>
              <div className={styles.metricIconBox}>
                <User size={13} />
              </div>
            </div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{studentStats.femaleCount}</span>
              <span className={styles.metricSubtext}>Peserta Wanita</span>
            </div>
          </div>

          {/* Card 5: Kontak WA */}
          <div className={`${styles.metricCard} ${styles.cardTeal}`}>
            <div className={styles.metricTopRow}>
              <span className={styles.metricLabel}>Kontak WhatsApp</span>
              <div className={styles.metricIconBox}>
                <Phone size={13} />
              </div>
            </div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{studentStats.hasPhoneCount}</span>
              <span className={styles.metricSubtext}>Nomor Terdata</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Roster Table ── */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={styles.modalHeaderIconBox}>
                  <User size={15} />
                </div>
                <h3 className={styles.modalTitle}>Detail Peserta Didik</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveStudentModal(null)}
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalProfileHead}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeStudentModal.full_name}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', alignItems: 'center' }}>
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
                  className={styles.btnPrimary}
                  style={{ textDecoration: 'none' }}
                >
                  <MessageSquare size={13} />
                  <span>Chat WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveStudentModal(null)}
                className={styles.btnSecondary}
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
