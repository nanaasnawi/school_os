'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import { useTeacherActionCenter } from '../../hooks';
import { TeacherMetricGrid, ActionCenterSkeleton } from '../shared';
import { getTenantItem } from '@/lib/tenant-storage';
import { getLiveDapodikAcademicYear } from '@/app/(dashboard)/dashboard/academic-years/page';
import { AtRiskStudentsWidget } from './AtRiskStudentsWidget';
import { PendingGradingWidget } from './PendingGradingWidget';
import { TodayScheduleWidget } from './TodayScheduleWidget';
import { RecentMaterialsWidget } from './RecentMaterialsWidget';
import { TeacherCalendarWidget } from './TeacherCalendarWidget';

function BuildingIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  );
}

function GraduationCapIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function RefreshIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 16h5v5"/>
    </svg>
  );
}

export function ActionCenterView() {
  const {
    isLoading,
    classes,
    selectedClassId,
    setSelectedClassId,
    todaySchedule,
    stats,
    atRiskStudents,
    pendingGrading,
    materials,
    refresh,
    handleResolveRisk,
  } = useTeacherActionCenter();

  // Live Real-Time Date & Clock State
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [schoolNpsn, setSchoolNpsn] = useState<string>('');
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>('2026/2027 (Semester Ganjil)');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(`${dateStr} · ${timeStr} WIB`);
    };

    updateDateTime();
    const liveAY = getLiveDapodikAcademicYear();
    if (liveAY?.name) {
      setActiveAcademicYear(liveAY.name);
    }

    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadNpsn = () => {
      if (typeof window !== 'undefined') {
        const storedNpsn = getTenantItem('dapodik_npsn');
        if (storedNpsn) setSchoolNpsn(storedNpsn);
      }
    };
    loadNpsn();

    async function fetchProfile() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        if (!token) return;
        const res = await fetch('/api/v1/schools/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.npsn) setSchoolNpsn(json.data.npsn);
        }
      } catch {}
    }
    fetchProfile();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refresh) await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <ActionCenterSkeleton />;
  }

  return (
    <div className={styles.pageContainer}>
      {/* ── Sub-Bar: Institutional Context, Live Clock & Telemetry ── */}
      <div className={styles.subBar}>
        <div className={styles.subBarLeft}>
          <div className={styles.institutionBadge}>
            <BuildingIcon size={14} />
            <span>NPSN: {schoolNpsn || '-'}</span>
          </div>

          <div className={styles.taBadge}>
            <GraduationCapIcon size={14} />
            <span>T.A {activeAcademicYear || '-'}</span>
          </div>
        </div>

        <div className={styles.subBarRight}>
          <button
            onClick={handleManualRefresh}
            className={styles.refreshBtn}
            title="Muat Ulang Data Real-Time"
          >
            <RefreshIcon size={13} className={isRefreshing ? styles.spinning : ''} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>

          <div className={styles.clockBadge}>
            <CalendarIcon size={14} />
            <span>{currentDateTime || 'Memuat waktu...'}</span>
            <span className={styles.liveDotPulse}>
              <span className={styles.pulsingDot} />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* 1. Top Metric Grid (4 Core Key Performance Cards) */}
      <TeacherMetricGrid stats={stats} />

      {/* 3. Unified Workstation Scope & Attendance Control Toolbar */}
      <div className={styles.workstationToolbar}>
        {/* Left: Class / Rombel Scope Switcher */}
        <div className={styles.toolbarFilterGroup}>
          <div className={styles.filterIconPill}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div className={styles.toolbarFilterText}>
            <label htmlFor="teacher-rombel-select" className={styles.filterTitle}>
              Lingkup Rombel:
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="teacher-rombel-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className={styles.toolbarSelect}
              >
                <option value="ALL">Semua Rombel Diampu ({classes.length} Rombel)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.student_count} Siswa)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className={styles.rombelTotalBadge}>
            {classes.length} Rombel Diampu
          </span>
        </div>

        {/* Right: Quick Attendance Banner Action */}
        <div className={styles.toolbarAttendanceGroup}>
          <div className={styles.attendanceTextInfo}>
            <div className={styles.attendanceBadgeRow}>
              <span className={styles.attendanceLiveDot} />
              <span className={styles.attendanceBadgeText}>Presensi Hari Ini</span>
            </div>
            <span className={styles.attendanceHintText}>
              Catat absensi rombel dan pantau rekapitulasi kehadiran.
            </span>
          </div>
          <Link href="/dashboard/attendance" className={styles.toolbarAttendanceBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Buka Lembar Presensi</span>
            <span className={styles.arrowIcon}>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* 4. Balanced 2-Column Dashboard Grid */}
      <div className={styles.actionCenterGrid}>
        {/* Left Column: Teaching Sessions & Student Risk Early Warning System */}
        <div className={styles.leftCol}>
          <TodayScheduleWidget schedules={todaySchedule} />
          <TeacherCalendarWidget />
          <AtRiskStudentsWidget
            students={atRiskStudents}
            onResolve={handleResolveRisk}
          />
        </div>

        {/* Right Column: Grading Queue & Active Learning Materials */}
        <div className={styles.rightCol}>
          <PendingGradingWidget tasks={pendingGrading} />
          <RecentMaterialsWidget materials={materials} />
        </div>
      </div>
    </div>
  );
}
