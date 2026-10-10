'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  category: string;
  color: string;
  description?: string;
}

export function TeacherCalendarWidget() {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    async function loadEvents() {
      try {
        const res = await fetch('/api/v1/academic/calendar?academicYear=2026/2027&semester=ODD');
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && json.success && Array.isArray(json.data)) {
            // Sort by startDate
            const sorted = json.data.slice(0, 4);
            setUpcomingEvents(sorted);
          }
        }
      } catch {
        // fallback silently
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-light, #e2e8f0)',
        borderRadius: '14px',
        padding: '1.15rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="3.5" width="16" height="14" rx="2" />
              <path d="M14 2v3M6 2v3M2 8.5h16" />
              <path d="M6 12h2v2H6zM10 12h2v2h-2zM14 12h2v2h-2z" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Kalender Pendidikan &amp; Alokasi MEB
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Semester Ganjil 2026/2027 • 18 Minggu Efektif (93 HEB)
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/teacher/calendar"
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#0284c7',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            textDecoration: 'none',
          }}
        >
          <span>Buka Kaldik Lengkap</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Mini KPI Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          background: 'var(--bg-elevated, #f8fafc)',
          padding: '0.6rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid var(--border-light, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Minggu Efektif</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#4f46e5' }}>18 MEB</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hari Efektif</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>93 Hari</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pekan Asesmen</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#d97706' }}>12 Hari</span>
        </div>
      </div>

      {/* Upcoming Agenda Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Agenda Akademik Terdekat:
        </span>

        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((ev) => {
            const sD = new Date(ev.startDate).getDate();
            const eD = new Date(ev.endDate).getDate();
            const sM = new Date(ev.startDate).toLocaleDateString('id-ID', { month: 'short' });
            const dateStr = sD === eD ? `${sD} ${sM}` : `${sD} - ${eD} ${sM}`;

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  fontSize: '0.74rem',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: ev.color || '#0284c7',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.title}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated, #f1f5f9)',
                    padding: '0.12rem 0.4rem',
                    borderRadius: '5px',
                    flexShrink: 0,
                  }}
                >
                  {dateStr}
                </span>
              </div>
            );
          })
        ) : (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Memuat agenda kalender...
          </div>
        )}
      </div>
    </div>
  );
}
