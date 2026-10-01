'use client';

import React from 'react';
import { TeacherInquiryView } from '@/features/teacher';

/**
 * Teacher Workstation: Tanya Guru & Konsultasi Siswa (Phase 5)
 * Thin route wrapper delegating domain logic to TeacherInquiryView
 */
export default function TeacherInquiryPage() {
  return <TeacherInquiryView />;
}
