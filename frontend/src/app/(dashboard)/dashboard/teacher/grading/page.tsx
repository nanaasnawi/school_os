'use client';

import React, { Suspense } from 'react';
import { MassGraderWorkspace } from '@/features/teacher';

/**
 * Teacher Workstation: Koreksi Massal & Penilaian (Mass Grader)
 * Adhering to Thin Route Rule (< 50 lines) from ADR-0008.
 */
export default function TeacherGradingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
          <span style={{ fontWeight: 600 }}>Memuat Workstation Koreksi Massal...</span>
        </div>
      }
    >
      <MassGraderWorkspace />
    </Suspense>
  );
}
