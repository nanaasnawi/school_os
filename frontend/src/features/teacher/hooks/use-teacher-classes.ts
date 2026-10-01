'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTeacherClasses, fetchClassStudents } from '../api';
import type { TeacherClassSummary, ClassStudentDto, ClassStudentStats } from '../types';

export function useTeacherClasses() {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const [students, setStudents] = useState<ClassStudentDto[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Load all classes assigned to the teacher
  const loadClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const data = await fetchTeacherClasses();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load teacher classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Load students when selectedClassId changes
  const loadStudents = useCallback(async (classId: string) => {
    setIsLoadingStudents(true);
    try {
      const studentList = await fetchClassStudents(classId);
      setStudents(studentList);

      // Update student count in classes state if it was 0
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId && c.student_count === 0 && studentList.length > 0
            ? { ...c, student_count: studentList.length }
            : c
        )
      );
    } catch (err) {
      console.error(`Failed to load students for class ${classId}:`, err);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId, loadStudents]);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const studentStats: ClassStudentStats = useMemo(() => {
    const total = students.length;
    let activeCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let hasPhoneCount = 0;

    for (const s of students) {
      const st = s.status?.toLowerCase() || '';
      if (st === 'active' || st === 'aktif') activeCount++;
      const g = s.gender?.toUpperCase() || '';
      if (g === 'L' || g === 'LAKI-LAKI') maleCount++;
      else if (g === 'P' || g === 'PEREMPUAN') femaleCount++;
      if (s.no_hp && s.no_hp.trim().length > 5) hasPhoneCount++;
    }

    return {
      total,
      activeCount: activeCount || total, // PKBM fallback
      maleCount,
      femaleCount,
      hasPhoneCount,
    };
  }, [students]);

  const selectClass = useCallback((id: string) => {
    setSelectedClassId(id);
  }, []);

  return {
    classes,
    isLoading: isLoadingClasses,
    isLoadingClasses,
    selectedClassId,
    selectedClass,
    students,
    isLoadingStudents,
    studentStats,
    selectClass,
    setSelectedClassId,
    refreshClasses: loadClasses,
    refreshStudents: () => {
      if (selectedClassId) loadStudents(selectedClassId);
    },
  };
}
