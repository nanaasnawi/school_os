'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentTeacherProfile,
  fetchTeacherClasses,
  fetchTodaySchedule,
  fetchWorkstationStats,
  fetchAtRiskStudents,
  fetchPendingGradingTasks,
  fetchActiveCbts,
  fetchRecentMaterials,
} from '../api';
import type {
  TeacherProfile,
  TeacherClassSummary,
  TodayScheduleItem,
  TeacherWorkstationStats,
  AtRiskStudent,
  PendingGradingTask,
  ActiveCbtSummary,
  TeacherRecentMaterial,
} from '../types';

export function useTeacherActionCenter() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [stats, setStats] = useState<TeacherWorkstationStats>({
    total_assigned_classes: 0,
    total_students: 0,
    pending_essay_submissions: 0,
    active_quizzes_count: 0,
    unread_inquiries_count: 0,
    average_class_reading_progress: 0,
  });
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGradingTask[]>([]);
  const [activeCbts, setActiveCbts] = useState<ActiveCbtSummary[]>([]);
  const [materials, setMaterials] = useState<TeacherRecentMaterial[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch core profile, schedule, materials, and active CBTs in parallel
      const [prof, sched, cbts, mats] = await Promise.all([
        fetchCurrentTeacherProfile(),
        fetchTodaySchedule(),
        fetchActiveCbts(),
        fetchRecentMaterials(selectedClassId === 'ALL' ? undefined : selectedClassId),
      ]);

      setProfile(prof);
      setTodaySchedule(sched);
      setActiveCbts(cbts);
      setMaterials(mats);

      // 2. Fetch classes & workstation stats reusing the already resolved profile
      const cls = await fetchTeacherClasses(prof || undefined);
      setClasses(cls);

      const st = await fetchWorkstationStats(cls);
      setStats(st);

      // Primary workstation dashboard is ready to display!
      setIsLoading(false);

      // 3. Asynchronously load secondary widgets (at-risk & pending grading) without blocking UI
      Promise.all([
        fetchAtRiskStudents(selectedClassId === 'ALL' ? undefined : selectedClassId, prof || undefined),
        fetchPendingGradingTasks(prof || undefined),
      ])
        .then(([risk, pending]) => {
          setAtRiskStudents(risk);
          setPendingGrading(pending);
        })
        .catch(console.error);
    } catch (err) {
      console.error('Error loading teacher action center data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle action click (e.g. remind student, view progress)
  const handleResolveRisk = (studentId: string) => {
    setAtRiskStudents((prev) => prev.filter((s) => s.student_id !== studentId));
  };

  return {
    isLoading,
    profile,
    classes,
    selectedClassId,
    setSelectedClassId,
    todaySchedule,
    stats,
    atRiskStudents,
    pendingGrading,
    activeCbts,
    materials,
    refresh: loadData,
    handleResolveRisk,
  };
}
