'use client';

import React from 'react';
import { TeacherAnalyticsView } from '@/features/teacher';

/**
 * Teacher Workstation: Teacher Analytics & Reading Progress (Phase 4)
 * Thin route wrapper delegating domain logic to TeacherAnalyticsView
 */
export default function TeacherAnalyticsPage() {
  return <TeacherAnalyticsView />;
}
