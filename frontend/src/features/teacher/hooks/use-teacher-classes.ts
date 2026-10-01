'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchTeacherClasses } from '../api';
import type { TeacherClassSummary } from '../types';

export function useTeacherClasses() {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherClasses();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load teacher classes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  return {
    classes,
    isLoading,
    selectedClassId,
    setSelectedClassId,
    refresh: loadClasses,
  };
}
