'use client';

import React, { useState } from 'react';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  const [tutoringHours, setTutoringHours] = useState(4);
  const [parentTouchpoints, setParentTouchpoints] = useState(2);
  const [executedAction, setExecutedAction] = useState<string | null>(null);

  // Dynamic projection calculations
  const predictedPassRate = Math.min(99, Math.round(76 + tutoringHours * 3.5 + parentTouchpoints * 4.2));
  const predictedRiskCount = Math.max(2, Math.round(18 - tutoringHours * 2.1 - parentTouchpoints * 2.8));

  const handleExecute = (actionTitle: string) => {
    setExecutedAction(actionTitle);
    setTimeout(() => setExecutedAction(null), 3500);
  };

  return (
    <div className={styles.page}>
      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Analisis &amp; Ruang Keputusan Eksekutif</h1>
          <p className={styles.subtitle}>Simulator intervensi risiko akademik, evaluasi efektivitas mengajar, &amp; eksekusi rekomendasi sistem</p>
        </div>
        <button className="btn btn-primary btn-sm">
          📊 Unduh Laporan Eksekutif (PDF)
        </button>
      </div>

      {executedAction && (
        <div className="badge badge-success" style={{ padding: '0.65rem 1rem', fontSize: '0.8rem' }}>
          ✓ Rekomendasi Keputusan "{executedAction}" Berhasil Dieksekusi! Notifikasi &amp; Jadwal Otomatis Diterbitkan.
        </div>
      )}

      {/* ── 1. Top Executive Indexes ── */}
      <div className={styles.execGrid}>
        <div className={styles.execCard}>
          <div className={styles.execIcon}>🎓</div>
          <div className={styles.execInfo}>
            <span className={styles.execTitle}>Indeks Kelulusan Akademik</span>
            <span className={styles.execVal}>84,0%</span>
            <span className={styles.execSub}>↑ 1,8% di atas target 80%</span>
          </div>
        </div>

        <div className={styles.execCard}>
          <div className={styles.execIcon}>👥</div>
          <div className={styles.execInfo}>
            <span className={styles.execTitle}>Presensi Terkonsolidasi</span>
            <span className={styles.execVal}>96,2%</span>
            <span className={styles.execSub}>↑ 2,4% peningkatan harian</span>
          </div>
        </div>

        <div className={styles.execCard}>
          <div className={styles.execIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>⚠️</div>
          <div className={styles.execInfo}>
            <span className={styles.execTitle}>Indeks Siswa Berisiko</span>
            <span className={styles.execVal}>11 Siswa</span>
            <span className={styles.execSub} style={{ color: '#dc2626' }}>↓ 2 siswa (Target ≤ 5%)</span>
          </div>
        </div>

        <div className={styles.execCard}>
          <div className={styles.execIcon} style={{ background: '#f3e8ff', color: '#9333ea' }}>⭐</div>
          <div className={styles.execInfo}>
            <span className={styles.execTitle}>Skor Efektivitas Guru</span>
            <span className={styles.execVal}>92,4/100</span>
            <span className={styles.execSub} style={{ color: '#9333ea' }}>Predikat Sangat Baik</span>
          </div>
        </div>
      </div>

      {/* ── 2. Grid Row 2: Executive Decision Center & Simulator ── */}
      <div className={styles.gridTwo}>
        {/* Pusat Rekomendasi Keputusan Otomatis */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div>
              <h2 className={styles.cardTitle}>Pusat Rekomendasi Keputusan Otomatis (Action Center)</h2>
              <p className={styles.cardSub}>Rekomendasi tindakan berbasis analitik data real-time</p>
            </div>
            <span className="badge badge-info">3 Prioritas Utama</span>
          </div>

          <div className={styles.decisionList}>
            {/* Action Item 1 */}
            <div className={styles.decisionCard} style={{ borderLeftColor: '#ef4444' }}>
              <div className={styles.decisionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-danger">PRIORITAS URGENT</span>
                  <span className={styles.decisionTitle}>Intervensi Fisika Kuantum Kelas 10-A (8 Siswa Terlambat)</span>
                </div>
              </div>
              <p className={styles.decisionDesc}>
                Sistem mendeteksi 8 siswa kelas 10-A melebihi batas tenggat waktu 48 jam. Rekomendasi: Terbitkan notifikasi WA ke orang tua &amp; jadwalkan klinik belajar Sabtu pagi.
              </p>
              <div className={styles.decisionActionRow}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecute('Intervensi Fisika Kuantum Kelas 10-A')}
                >
                  ⚡ Eksekusi Intervensi &amp; Kirim Notifikasi WA
                </button>
              </div>
            </div>

            {/* Action Item 2 */}
            <div className={styles.decisionCard} style={{ borderLeftColor: '#f59e0b' }}>
              <div className={styles.decisionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-warning">PERINGATAN MODERAT</span>
                  <span className={styles.decisionTitle}>Pendampingan Presensi Kelas 8-B (Kehadiran Turun 7%)</span>
                </div>
              </div>
              <p className={styles.decisionDesc}>
                Presensi akumulasi kelas 8-B turun ke 88%. Rekomendasi: Panggil wali kelas 8-B untuk konseling kehadiran dengan Guru BK.
              </p>
              <div className={styles.decisionActionRow}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExecute('Pendampingan Presensi Kelas 8-B')}
                >
                  📅 Buat Sesi Konsultasi BK
                </button>
              </div>
            </div>

            {/* Action Item 3 */}
            <div className={styles.decisionCard} style={{ borderLeftColor: '#10b981' }}>
              <div className={styles.decisionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-success">APRESIASI</span>
                  <span className={styles.decisionTitle}>Apresiasi Kinerja Pengajar Matematika Kelas 10-B (+5,2 Poin)</span>
                </div>
              </div>
              <p className={styles.decisionDesc}>
                Nilai rata-rata Matematika kelas 10-B melonjak signifikan. Rekomendasi: Berikan lencana bintang apresiasi pengajar terbaik bulan Mei.
              </p>
              <div className={styles.decisionActionRow}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExecute('Apresiasi Guru Matematika')}
                >
                  ⭐ Terbitkan Lencana Apresiasi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Intervensi Akademik */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div>
              <h2 className={styles.cardTitle}>Simulator Skenario Intervensi</h2>
              <p className={styles.cardSub}>Proyeksi dampak bimbingan &amp; komunikasi orang tua</p>
            </div>
          </div>

          <div className={styles.simBox}>
            <div className={styles.simSliderGroup}>
              <div className={styles.simSliderHeader}>
                <span>Jam Bimbingan Tambahan per Minggu</span>
                <strong style={{ color: '#2563eb' }}>{tutoringHours} Jam / Minggu</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={tutoringHours}
                onChange={e => setTutoringHours(Number(e.target.value))}
                className={styles.simSlider}
              />
            </div>

            <div className={styles.simSliderGroup}>
              <div className={styles.simSliderHeader}>
                <span>Komunikasi / Touchpoint Wali Murid</span>
                <strong style={{ color: '#2563eb' }}>{parentTouchpoints} Kontak / Bulan</strong>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={parentTouchpoints}
                onChange={e => setParentTouchpoints(Number(e.target.value))}
                className={styles.simSlider}
              />
            </div>

            <div className={styles.simResultGrid}>
              <div className={styles.simResultCard}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proyeksi Kelulusan</span>
                <span className={styles.simResultVal} style={{ color: '#16a34a' }}>{predictedPassRate}%</span>
                <span style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 700 }}>↑ Hasil Optimal</span>
              </div>

              <div className={styles.simResultCard}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proyeksi Siswa Berisiko</span>
                <span className={styles.simResultVal} style={{ color: '#2563eb' }}>{predictedRiskCount} Siswa</span>
                <span style={{ fontSize: '0.66rem', color: '#2563eb', fontWeight: 700 }}>↓ Penurunan Risiko</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Table Evaluasi Kualitas Akademik per Mata Pelajaran ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <div>
            <h2 className={styles.cardTitle}>Matriks Evaluasi Kinerja Mata Pelajaran &amp; Distribusi Nilai</h2>
            <p className={styles.cardSub}>Rekapitulasi tingkat kelulusan, rerata nilai akhir, dan status tindak lanjut</p>
          </div>
        </div>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Mata Pelajaran</th>
              <th>Pengampu Utama</th>
              <th>Rata-rata Nilai</th>
              <th>Tingkat Kelulusan</th>
              <th>Distribusi Grade (A / B / C / D)</th>
              <th>Status Intervensi</th>
            </tr>
          </thead>
          <tbody>
            {[
              { subject: 'Bahasa Inggris', teacher: 'Ibu Ratna Pertiwi, M.Pd', avg: '94,2', pass: '98%', dist: '70% A / 25% B / 5% C', status: '✓ Kinerja Sangat Baik', badge: 'badge-success' },
              { subject: 'Matematika', teacher: 'Bpk. Hendra Wijaya, M.Sc', avg: '88,7', pass: '92%', dist: '55% A / 35% B / 10% C', status: '✓ Memenuhi Target', badge: 'badge-success' },
              { subject: 'Fisika', teacher: 'Bpk. Eko Prasetyo, M.T', avg: '88,5', pass: '91%', dist: '50% A / 40% B / 10% C', status: '✓ Memenuhi Target', badge: 'badge-success' },
              { subject: 'Kimia', teacher: 'Ibu Dewi Susanti, M.Si', avg: '81,3', pass: '83%', dist: '35% A / 45% B / 20% C', status: '✓ Memenuhi Target', badge: 'badge-success' },
              { subject: 'Bahasa Indonesia', teacher: 'Ibu Siti Aminah, S.Pd', avg: '74,0', pass: '68%', dist: '20% A / 40% B / 40% D', status: '⚠️ Perlu Klinik Belajar', badge: 'badge-warning' },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700 }}>{row.subject}</td>
                <td>{row.teacher}</td>
                <td style={{ fontWeight: 700 }}>{row.avg}</td>
                <td style={{ fontWeight: 700, color: '#16a34a' }}>{row.pass}</td>
                <td><code style={{ fontSize: '0.72rem' }}>{row.dist}</code></td>
                <td><span className={`badge ${row.badge}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
