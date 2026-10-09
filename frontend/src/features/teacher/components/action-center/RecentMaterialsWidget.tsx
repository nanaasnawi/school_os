'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './action-center.module.css';
import type { TeacherRecentMaterial } from '../../types';

interface RecentMaterialsWidgetProps {
  materials?: TeacherRecentMaterial[];
}

function formatMaterialDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}
function formatMaterialTitle(rawTitle?: string): { badge: string | null; cleanTitle: string } {
  if (!rawTitle) return { badge: null, cleanTitle: 'Materi Pembelajaran' };
  let title = rawTitle.trim();
  let badge: string | null = null;

  if (title.toLowerCase().startsWith('materi bacaan:')) {
    badge = 'Bacaan';
    title = title.substring('materi bacaan:'.length).trim();
  } else if (title.toLowerCase().startsWith('buku siswa:')) {
    badge = 'Buku Siswa';
    title = title.substring('buku siswa:'.length).trim();
  } else if (title.toLowerCase().startsWith('panduan guru:')) {
    badge = 'Panduan';
    title = title.substring('panduan guru:'.length).trim();
  } else if (title.toLowerCase().startsWith('video pembelajaran:')) {
    badge = 'Video';
    title = title.substring('video pembelajaran:'.length).trim();
  } else if (title.toLowerCase().startsWith('rangkuman:')) {
    badge = 'Rangkuman';
    title = title.substring('rangkuman:'.length).trim();
  }

  if (title.length > 55) {
    title = title.slice(0, 52).trim() + '...';
  }

  return { badge, cleanTitle: title };
}

export function RecentMaterialsWidget({ materials = [] }: RecentMaterialsWidgetProps) {
  // Sort materials so that the newest is at the very top
  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [materials]);

  // Max materials to display: 5 items to keep it visually balanced with At-Risk analytics
  const displayMaterials = sortedMaterials.slice(0, 5);

  return (
    <div className={styles.widgetCard}>
      {/* ── Widget Header ── */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <div className={styles.materialHeaderIconBox}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <h3 className={styles.widgetTitle}>
              Materi &amp; Modul Ajar
              <span className={styles.badgeCountNeutral}>{materials.length}</span>
            </h3>
            <p className={styles.widgetSub}>
              Bahan ajar dan modul aktif diurutkan dari yang paling terbaru.
            </p>
          </div>
        </div>
        <Link href="/dashboard/learning/materials" className={styles.headerActionLink}>
          <span>Lihat Semua</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* ── Content List or Rich Empty State ── */}
      {sortedMaterials.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.materialEmptyIconBox}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className={styles.emptyStateTitle}>Belum Ada Materi Pembelajaran</span>
          <span className={styles.emptyStateSub}>
            Materi dan modul modul ajar yang Anda terbitkan akan ditampilkan di sini.
          </span>
          <Link
            href="/dashboard/learning/materials/create"
            className={styles.actionBtnSmall}
            style={{ marginTop: '0.5rem' }}
          >
            + Unggah Materi Baru
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.materialScrollList}>
            {displayMaterials.map((m, idx) => {
              const { badge, cleanTitle } = formatMaterialTitle(m.title);
              return (
                <div key={m.id} className={styles.materialItem}>
                  <div className={styles.materialLeft}>
                    <div className={styles.materialIconPill}>
                      {m.material_type === 'video' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      )}
                    </div>
                    <div className={styles.materialInfo}>
                      <div className={styles.materialTitleRow}>
                        {badge && (
                          <span className={styles.materialTypePill}>{badge}</span>
                        )}
                        <span className={styles.materialTitle} title={m.title}>
                          {cleanTitle}
                        </span>
                        {idx === 0 && (
                          <span className={styles.badgeNewest}>Terbaru</span>
                        )}
                      </div>
                    <div className={styles.materialMetaRow}>
                      {m.class_name && (
                        <span className={styles.materialClassBadge}>{m.class_name}</span>
                      )}
                      <span>{m.subject_name || 'Umum'}</span>
                      {m.total_pages && m.total_pages > 1 ? (
                        <>
                          <span>&bull;</span>
                          <span>{m.total_pages} Hlm</span>
                        </>
                      ) : null}
                      {m.created_at ? (
                        <>
                          <span>&bull;</span>
                          <span>{formatMaterialDate(m.created_at)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={styles.materialRight}>
                  <Link
                    href={`/dashboard/learning/materials?id=${m.id}`}
                    className={styles.actionBtnSmall}
                    title="Buka Lembar Materi"
                  >
                    <span>Buka</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
                </div>
              );
            })}
          </div>

          <div className={styles.listFooter}>
            <span>
              Menampilkan <strong>{displayMaterials.length}</strong> materi terbaru • Total <strong>{sortedMaterials.length}</strong> modul
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/dashboard/learning/materials/create"
                className={styles.actionBtnSmall}
                title="Unggah materi pembelajaran baru"
              >
                + Tambah Materi
              </Link>
              <Link href="/dashboard/learning/materials" className={styles.headerActionLink}>
                <span>Kelola</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
