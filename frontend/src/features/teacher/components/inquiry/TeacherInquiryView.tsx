'use client';

import React, { useState, useMemo } from 'react';
import styles from './TeacherInquiryView.module.css';
import { useTeacherInquiries } from '../../hooks';
import type { InquiryThread } from '../../types';
import { DataTable, StatusBadge, Column } from '@/shared/ui/data-table';

export function TeacherInquiryView() {
  const {
    filteredThreads,
    isLoading,
    metrics,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    availableClasses,
    activeDetail,
    isLoadingDetail,
    isSendingReply,
    openThread,
    closeThreadDetail,
    sendReply,
    resolveThread,
    refresh,
  } = useTeacherInquiries();

  const [replyText, setReplyText] = useState('');

  const handleSend = async () => {
    if (!replyText.trim()) return;
    const ok = await sendReply(replyText);
    if (ok) {
      setReplyText('');
    }
  };

  const handlePresetClick = (text: string) => {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  };

  // ── Columns definition (Strict Screenshot Table Alignment) ──
  const columns: Column<InquiryThread>[] = useMemo(
    () => [
      {
        key: 'student_name',
        header: 'Nama Peserta Didik',
        sortable: true,
        render: (item) => (
          <div>
            <span className={styles.studentName}>{item.student_name}</span>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {item.student_class}
            </div>
          </div>
        ),
      },
      {
        key: 'subject_name',
        header: 'Mata Pelajaran',
        sortable: true,
        render: (item) => (
          <span className={styles.subjectBadge}>
            {item.subject_name || 'Umum'}
          </span>
        ),
      },
      {
        key: 'reference_title',
        header: 'Topik / Referensi',
        sortable: true,
        render: (item) => (
          <div style={{ maxWidth: '240px' }}>
            <span className={styles.referenceBadge}>
              {item.inquiry_type || 'Tanya'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
              {item.reference_title}
            </span>
          </div>
        ),
      },
      {
        key: 'last_message_content',
        header: 'Pesan Terakhir',
        sortable: false,
        render: (item) => (
          <div className={styles.messageSnippet} title={item.last_message_content || ''}>
            {item.last_message_content || 'Belum ada pesan.'}
          </div>
        ),
      },
      {
        key: 'last_message_at',
        header: 'Waktu',
        sortable: true,
        render: (item) => (
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            {item.last_message_at
              ? new Date(item.last_message_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        align: 'center',
        render: (item) => {
          const s = item.status?.toUpperCase() || 'OPEN';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              {s === 'ANSWERED' || s === 'TERJAWAB' || s === 'DIJAWAB' ? (
                <StatusBadge status="Paid" label="Dijawab" />
              ) : s === 'OPEN' || s === 'MENUNGGU' || s === 'WAITING_REPLY' ? (
                <StatusBadge status="Pending" label="Menunggu Jawaban" />
              ) : (
                <StatusBadge status="Cancelled" label="Ditutup" />
              )}
              {item.read_status_label && (
                <span style={{
                  fontSize: '0.7rem',
                  color: item.read_status_label.includes('Dibaca') ? '#059669' : '#d97706',
                  fontWeight: 600,
                }}>
                  {item.read_status_label}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Aksi',
        sortable: false,
        align: 'right',
        render: (item) => (
          <button
            type="button"
            onClick={() => openThread(item.id)}
            className={styles.btnAction}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <span>Buka Diskusi</span>
          </button>
        ),
      },
    ],
    [openThread]
  );

  return (
    <div className={styles.container}>
      {/* ── Top Header ── */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleSection}>
          <div className={styles.badgeHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Teacher Workstation
          </div>
          <h1 className={styles.title}>Tanya Guru &amp; Konsultasi Siswa</h1>
          <p className={styles.subtitle}>
            Tanggapi pertanyaan materi, konsultasi tugas, dan diskusi interaktif dari aplikasi Android siswa.
          </p>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            onClick={() => refresh()}
            className={`${styles.btnAction} ${styles.btnPrimary}`}
            title="Perbarui daftar diskusi"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards (Admin Dashboard Design) ── */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Total Percakapan */}
        <div className={`${styles.metricCard} ${styles.cardIndigo}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.total_inquiries}</div>
              <div className={styles.metricSubtitle}>Thread Konsultasi Masuk</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Total Percakapan Siswa</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 2: Menunggu Balasan */}
        <div className={`${styles.metricCard} ${styles.cardOrange}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.open_inquiries}</div>
              <div className={styles.metricSubtitle}>Perlu Ditanggapi Guru</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Menunggu Jawaban</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 3: Sudah Terjawab */}
        <div className={`${styles.metricCard} ${styles.cardBlue}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.answered_inquiries}</div>
              <div className={styles.metricSubtitle}>Telah Direspons Guru</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Dijawab</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Card 4: Selesai / Ditutup */}
        <div className={`${styles.metricCard} ${styles.cardEmerald}`}>
          <div className={styles.metricTop}>
            <div className={styles.metricInfo}>
              <div className={styles.metricValue}>{metrics.resolved_inquiries}</div>
              <div className={styles.metricSubtitle}>Konsultasi Selesai / Tuntas</div>
            </div>
            <div className={styles.metricWatermark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
          </div>
          <div className={styles.metricBottom}>
            <span>Selesai &amp; Ditutup</span>
            <svg className={styles.metricArrow} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterItem}>
            <span>Rombel:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">Semua Rombel</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.statusPills}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`${styles.statusPillBtn} ${statusFilter === 'ALL' ? styles.statusPillBtnActive : ''}`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            className={`${styles.statusPillBtn} ${statusFilter === 'OPEN' ? styles.statusPillBtnActive : ''}`}
          >
            Menunggu Jawaban ({metrics.open_inquiries})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ANSWERED')}
            className={`${styles.statusPillBtn} ${statusFilter === 'ANSWERED' ? styles.statusPillBtnActive : ''}`}
          >
            Dijawab ({metrics.answered_inquiries})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RESOLVED')}
            className={`${styles.statusPillBtn} ${statusFilter === 'RESOLVED' ? styles.statusPillBtnActive : ''}`}
          >
            Selesai ({metrics.resolved_inquiries})
          </button>
        </div>
      </div>

      {/* ── Screenshot-Exact Inquiry DataTable ── */}
      <DataTable<InquiryThread>
        columns={columns}
        data={filteredThreads}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Cari nama siswa, rombel, materi, atau topik..."
        emptyTitle="Belum Ada Diskusi Siswa"
        emptyDescription="Pertanyaan yang diajukan peserta didik melalui aplikasi Android akan muncul di daftar ini secara live."
        defaultPageSize={10}
      />

      {/* ── Interactive Chat & Consultation Modal Drawer ── */}
      {activeDetail && (
        <div className={styles.modalBackdrop} onClick={closeThreadDetail}>
          <div className={styles.chatCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatHeader}>
              <div>
                <h3 className={styles.chatTitle}>
                  {activeDetail.thread.student_name} ({activeDetail.thread.student_class})
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{activeDetail.thread.subject_name} • {activeDetail.thread.reference_title}</span>
                  {activeDetail.thread.read_status_label && (
                    <span style={{
                      fontSize: '0.72rem',
                      background: activeDetail.thread.read_status_label.includes('Dibaca') ? '#ecfdf5' : '#fffbeb',
                      color: activeDetail.thread.read_status_label.includes('Dibaca') ? '#059669' : '#d97706',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}>
                      {activeDetail.thread.read_status_label}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activeDetail.thread.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => resolveThread(activeDetail.thread.id)}
                    className={styles.btnAction}
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    title="Tandai konsultasi ini telah selesai"
                  >
                    Tandai Selesai
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeThreadDetail}
                  className={styles.btnAction}
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.chatBody}>
              {isLoadingDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                  <div className="skeleton" style={{ width: '60%', height: '52px', borderRadius: '14px', alignSelf: 'flex-start' }} />
                  <div className="skeleton" style={{ width: '70%', height: '64px', borderRadius: '14px', alignSelf: 'flex-end' }} />
                  <div className="skeleton" style={{ width: '50%', height: '48px', borderRadius: '14px', alignSelf: 'flex-start' }} />
                </div>
              ) : (
                activeDetail.messages.map((msg) => {
                  const isTeacher = msg.is_from_teacher;
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.chatBubble} ${isTeacher ? styles.bubbleTeacher : styles.bubbleStudent}`}
                    >
                      <span className={styles.bubbleSender}>
                        {isTeacher ? 'Bapak/Ibu Guru' : msg.sender_name}
                      </span>
                      <span>{msg.content}</span>
                      <span className={styles.bubbleTime} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isTeacher && (
                          <span style={{ fontSize: '0.72rem', color: msg.is_read ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                            {msg.is_read ? '✓✓ Dibaca Siswa' : '✓ Terkirim'}
                          </span>
                        )}
                        {!isTeacher && msg.is_read && (
                          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                            ✓ Dibaca Guru
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.chatInputArea}>
              <div className={styles.presetChips}>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick('Silakan pelajari kembali bab terkait pada buku paket ya.')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>Pelajari Bab Terkait</span>
                </button>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick('Pertanyaan bagus! Perhatikan bagian rumusnya ya.')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Perhatikan Rumus</span>
                </button>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick('Jawaban kamu sudah tepat, silakan dilanjutkan.')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Sudah Tepat</span>
                </button>
              </div>

              <div className={styles.chatInputBox}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ketik tanggapan atau penjelasan untuk siswa..."
                  className={styles.chatTextarea}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSendingReply || !replyText.trim()}
                  className={`${styles.btnAction} ${styles.btnPrimary}`}
                  style={{ padding: '0.65rem 1.15rem' }}
                >
                  {isSendingReply ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
