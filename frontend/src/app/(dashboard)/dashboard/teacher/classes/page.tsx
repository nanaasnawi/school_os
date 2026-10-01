'use client';

import React from 'react';
import { TeacherClassesView } from '@/features/teacher';

/**
 * Teacher Workstation: Kelas Saya & Roster Siswa (Phase 3)
 * Thin route wrapper delegating domain logic to TeacherClassesView
 */
export default function TeacherClassesPage() {
  return <TeacherClassesView />;
}
