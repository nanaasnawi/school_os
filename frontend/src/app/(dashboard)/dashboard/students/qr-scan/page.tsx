'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './qr-scan.module.css';

export default function QrScanPage() {
  const [tokenState, setTokenState] = useState<'ISSUED' | 'CLAIMED' | 'VERIFIED' | 'APPROVED' | 'CONSUMED'>('VERIFIED');
  const [scannedToken, setScannedToken] = useState<{
    requestId: string;
    opaqueToken: string;
    expiresAtWindow: string;
    nama: string;
    nisn: string;
    nik: string;
    tglLahir: string;
    ibuKandung: string;
    noHp: string;
    rombel: string;
  } | null>({
    requestId: '01K9Z82103891029310A',
    opaqueToken: 'opq_91a82f30b912a881',
    expiresAtWindow: '15 - 60 Menit (Configurable Policy Window)',
    nama: 'MUHAMMAD RIZKY PRATAMA',
    nisn: '0084920188',
    nik: '3273011405080009',
    tglLahir: '14 Mei 2011 (Bandung)',
    ibuKandung: 'SITI RAHMAWATI',
    noHp: '081234567890',
    rombel: 'Kelas 7A',
  });

  const handleApproveAndConsume = () => {
    setTokenState('APPROVED');
    setTimeout(() => {
      setTokenState('CONSUMED');
    }, 1500);
  };

  const handleSimulateScan = () => {
    setTokenState('VERIFIED');
    setScannedToken({
      requestId: '01K9Z89920182910291B',
      opaqueToken: 'opq_c8f910a2b90123ef',
      expiresAtWindow: '30 Menit Policy Window',
      nama: 'ANNISA DEWI MAHARANI',
      nisn: '0089201933',
      nik: '3273015509080012',
      tglLahir: '15 September 2011 (Bandung)',
      ibuKandung: 'NINA HERLINA',
      noHp: '082198765432',
      rombel: 'Kelas 7B',
    });
  };

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>📷</div>
          <div>
            <h1 className={styles.headerTitle}>Opaque Token State Machine Scanner</h1>
            <p className={styles.headerSub}>ISSUED ➔ CLAIMED ➔ VERIFIED ➔ APPROVED ➔ CONSUMED (Server-Side Invariants)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/dashboard/dapodik" className="btn btn-secondary">
            🌉 Local Bridge ACL Hub
          </Link>
          <Link href="/dashboard/students" className="btn btn-secondary">
            👥 Master Students
          </Link>
        </div>
      </div>

      {/* Main Grid: Scanner (Left) vs Extracted Card (Right) */}
      <div className={styles.scanGrid}>
        {/* Left: Camera Scanner Box */}
        <div className={styles.scannerCard}>
          <div className={styles.confidenceBadge}>
            <span>🟢 Kamera Laptop Aktif (Webcam Scanner)</span>
          </div>

          <div className={styles.cameraViewfinder}>
            <div className={styles.scannerOverlayFrame}>
              <div className={styles.laserLine} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', zIndex: 1, textAnchor: 'middle' }}>
              <span>📷 Pemindaian Opaque Token QR Code</span>
            </div>
          </div>

          <p className={styles.scanStatusText}>
            Validasi Server-Side. Window Expiration: <strong>15–60 Menit</strong>.
          </p>

          <button onClick={handleSimulateScan} className="btn btn-secondary" style={{ width: '100%' }}>
            🔄 Simulasi Scan Token Lain
          </button>
        </div>

        {/* Right: Extracted Student Data Card */}
        <div className={styles.extractedCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.875rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '4px' }}>✓ ZERO TRANSCRIPTION ERROR</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Token State Machine</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-active" style={{ background: tokenState === 'CONSUMED' ? 'rgba(22, 163, 74, 0.10)' : '#dbeafe', color: tokenState === 'CONSUMED' ? 'var(--success)' : '#1d4ed8' }}>
                STATE: {tokenState}
              </span>
            </div>
          </div>

          {/* Token Lifecycle Pipeline Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
            <span style={{ color: '#16a34a' }}>1. ISSUED ✓</span>
            <span>➔</span>
            <span style={{ color: '#16a34a' }}>2. CLAIMED ✓</span>
            <span>➔</span>
            <span style={{ color: tokenState === 'VERIFIED' || tokenState === 'APPROVED' || tokenState === 'CONSUMED' ? '#16a34a' : '#64748b' }}>3. VERIFIED</span>
            <span>➔</span>
            <span style={{ color: tokenState === 'APPROVED' || tokenState === 'CONSUMED' ? '#16a34a' : '#64748b' }}>4. APPROVED</span>
            <span>➔</span>
            <span style={{ color: tokenState === 'CONSUMED' ? '#16a34a' : '#64748b' }}>5. CONSUMED</span>
          </div>

          {scannedToken ? (
            <>
              <div className={styles.dataFieldGroup}>
                <div className={styles.fieldBox} style={{ gridColumn: 'span 2', background: 'var(--accent-dim)', border: '1px solid var(--border-subtle)' }}>
                  <div className={styles.fieldLabel}>Request ID &amp; Short-Lived Opaque Token</div>
                  <div className={styles.fieldVal} style={{ color: '#2563eb', fontSize: '0.85rem' }}>
                    ID: {scannedToken.requestId} • <code style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>{scannedToken.opaqueToken}</code>
                  </div>
                </div>

                <div className={styles.fieldBox} style={{ gridColumn: 'span 2' }}>
                  <div className={styles.fieldLabel}>Nama Lengkap Siswa (Sesuai Akta/Dukcapil)</div>
                  <div className={styles.fieldVal} style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{scannedToken.nama}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>NISN (10 Digit)</div>
                  <div className={styles.fieldVal}>{scannedToken.nisn}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>NIK (16 Digit Valid)</div>
                  <div className={styles.fieldVal}>{scannedToken.nik}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>Tempat &amp; Tanggal Lahir</div>
                  <div className={styles.fieldVal}>{scannedToken.tglLahir}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>Nama Ibu Kandung (Authoritative Matching)</div>
                  <div className={styles.fieldVal}>{scannedToken.ibuKandung}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>No. HP Orang Tua / WA</div>
                  <div className={styles.fieldVal}>{scannedToken.noHp}</div>
                </div>

                <div className={styles.fieldBox}>
                  <div className={styles.fieldLabel}>Usulan Rombel / Kelas</div>
                  <div className={styles.fieldVal}>{scannedToken.rombel}</div>
                </div>
              </div>

              {tokenState === 'CONSUMED' && (
                <div style={{ padding: '0.75rem', background: 'rgba(22, 163, 74, 0.10)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: '12px', color: 'var(--success)', fontWeight: 700, fontSize: '0.84rem' }}>
                  ✓ Transaksi Berhasil! Token Resmi Dimusnahkan (CONSUMED) &amp; Event Dimuat ke Outbox Queue Engine!
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                <button
                  onClick={handleApproveAndConsume}
                  disabled={tokenState === 'CONSUMED'}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.85rem' }}
                >
                  {tokenState === 'CONSUMED' ? '✓ Token Consumed & Transacted' : '⚡ Approve & Execute Token Consumption'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Pindai QR Token untuk memverifikasi request pendaftaran siswa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
