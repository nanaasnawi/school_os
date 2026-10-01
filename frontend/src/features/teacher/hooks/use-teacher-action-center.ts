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
} from '../api';
import type {
  TeacherProfile,
  TeacherClassSummary,
  TodayScheduleItem,
  TeacherWorkstationStats,
  AtRiskStudent,
  PendingGradingTask,
  ActiveCbtSummary,
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        prof,
        cls,
        sched,
        st,
        risk,
        pending,
        cbts,
      ] = await Promise.all([
        fetchCurrentTeacherProfile(),
        fetchTeacherClasses(),
        fetchTodaySchedule(),
        fetchWorkstationStats(),
        fetchAtRiskStudents(selectedClassId === 'ALL' ? undefined : selectedClassId),
        fetchPendingGradingTasks(),
        fetchActiveCbts(),
      ]);

      setProfile(prof);
      setClasses(cls);
      setTodaySchedule(sched);
      setStats(st);
      setAtRiskStudents(risk);
      setPendingGrading(pending);
      setActiveCbts(cbts);
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
    refresh: loadData,
    handleResolveRisk,
  };
}
