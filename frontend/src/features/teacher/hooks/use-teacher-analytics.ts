'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllTeacherReadingAnalytics } from '../api';
import type {
  MaterialAnalyticsOverview,
  StudentReadingProgressRow,
  TeacherReadingMetrics,
} from '../types';

export function useTeacherAnalytics() {
  const [materials, setMaterials] = useState<MaterialAnalyticsOverview[]>([]);
  const [readingRows, setReadingRows] = useState<StudentReadingProgressRow[]>([]);
  const [metrics, setMetrics] = useState<TeacherReadingMetrics>({
    total_materials: 0,
    total_readers: 0,
    completed_readers: 0,
    overall_completion_rate: 0,
    total_pages_read: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllTeacherReadingAnalytics();
      setMaterials(data.materials);
      setReadingRows(data.readingRows);
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Failed to load teacher reading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique classes from materials and rows
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.class_name && m.class_name !== 'Semua Rombel') set.add(m.class_name);
    });
    readingRows.forEach((r) => {
      if (r.class_name) set.add(r.class_name);
    });
    return Array.from(set).sort();
  }, [materials, readingRows]);

  // Compute filtered rows
  const filteredRows = useMemo(() => {
    return readingRows.filter((row) => {
      // 1. Material filter
      if (selectedMaterialId !== 'ALL' && row.material_id !== selectedMaterialId) {
        return false;
      }
      // 2. Class filter
      if (selectedClassFilter !== 'ALL' && row.class_name !== selectedClassFilter) {
        return false;
      }
      // 3. Status filter
      if (selectedStatusFilter !== 'ALL' && row.reading_status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [readingRows, selectedMaterialId, selectedClassFilter, selectedStatusFilter]);

  // Dynamic metrics based on current filtered view
  const activeMetrics: TeacherReadingMetrics = useMemo(() => {
    if (selectedMaterialId === 'ALL' && selectedClassFilter === 'ALL' && selectedStatusFilter === 'ALL') {
      return metrics;
    }

    const total = filteredRows.length;
    const completed = filteredRows.filter((r) => r.is_completed).length;
    const pages = filteredRows.reduce((acc, r) => acc + (r.current_page || 0), 0);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total_materials: selectedMaterialId === 'ALL' ? materials.length : 1,
      total_readers: total,
      completed_readers: completed,
      overall_completion_rate: rate,
      total_pages_read: pages,
    };
  }, [metrics, filteredRows, selectedMaterialId, selectedClassFilter, selectedStatusFilter, materials]);

  return {
    materials,
    readingRows,
    filteredRows,
    metrics: activeMetrics,
    isLoading,
    availableClasses,
    selectedMaterialId,
    setSelectedMaterialId,
    selectedClassFilter,
    setSelectedClassFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    refresh: loadData,
  };
}
