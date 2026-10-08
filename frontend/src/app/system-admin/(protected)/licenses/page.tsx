'use client';

import React, { useState } from 'react';
import styles from '../dashboard/system.module.css';
import {
  CreditCard,
  Building2,
  Users,
  HardDrive,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  Search,
  Check,
  X,
  Plus,
  ShieldCheck,
  Package,
} from 'lucide-react';

type TenantQuotaItem = {
  tenant_id: string;
  school_name: string;
  tier: 'Enterprise Dedicated' | 'Institutional Pro' | 'Standard Education';
  max_students: number;
  current_students: number;
  max_storage_gb: number;
  used_storage_gb: number;
  modules: {
    lms: boolean;
    cbt: boolean;
    dapodik: boolean;
    qr_presence: boolean;
    finance: boolean;
  };
  expires_at: string;
  status: 'Aktif' | 'Masa Tenggang';
};

const INITIAL_QUOTAS: TenantQuotaItem[] = [
  {
    tenant_id: 't-smpn1',
    school_name: 'SMP Negeri 1 Indonesia',
    tier: 'Enterprise Dedicated',
    max_students: 1500,
    current_students: 940,
    max_storage_gb: 100,
    used_storage_gb: 34.2,
    modules: { lms: true, cbt: true, dapodik: true, qr_presence: true, finance: true },
    expires_at: '2027-12-31',
    status: 'Aktif',
  },
  {
    tenant_id: 't-sman2',
    school_name: 'SMA Swasta Teladan Mandiri',
    tier: 'Institutional Pro',
    max_students: 800,
    current_students: 520,
    max_storage_gb: 50,
    used_storage_gb: 18.6,
    modules: { lms: true, cbt: true, dapodik: true, qr_presence: true, finance: false },
    expires_at: '2027-06-30',
    status: 'Aktif',
  },
  {
    tenant_id: 't-pkbm01',
    school_name: 'PKBM Akselerasi Cendekia',
    tier: 'Standard Education',
    max_students: 300,
    current_students: 145,
    max_storage_gb: 20,
    used_storage_gb: 5.1,
    modules: { lms: true, cbt: false, dapodik: true, qr_presence: false, finance: false },
    expires_at: '2026-12-31',
    status: 'Aktif',
  },
  {
    tenant_id: 't-sdn04',
    school_name: 'SD Negeri Harapan Bangsa',
    tier: 'Institutional Pro',
    max_students: 600,
    current_students: 310,
    max_storage_gb: 50,
    used_storage_gb: 8.4,
    modules: { lms: true, cbt: true, dapodik: true, qr_presence: true, finance: true },
    expires_at: '2027-08-15',
    status: 'Aktif',
  },
];

export default function SystemLicensesPage() {
  const [quotas, setQuotas] = useState<TenantQuotaItem[]>(INITIAL_QUOTAS);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<TenantQuotaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setQuotas(quotas.map((q) => (q.tenant_id === selectedItem.tenant_id ? selectedItem : q)));
    setSelectedItem(null);
    showToast(`Kebijakan kuota dan modul untuk ${selectedItem.school_name} berhasil diperbarui.`);
  };

  const filtered = quotas.filter(
    (q) =>
      q.school_name.toLowerCase().includes(search.toLowerCase()) ||
      q.tier.toLowerCase().includes(search.toLowerCase()) ||
      q.tenant_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {toastMessage && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toast} ${styles.toastSuccess}`}>
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Alokasi Lisensi &amp; Kuota Modul</h1>
          <p className={styles.subtitle}>
            Kelola alokasi kapasitas siswa, batas penyimpanan cloud, dan hak akses modul fitur per tenant institusi.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>Multi-Tenant Entitlement Engine</span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Lisensi Aktif</span>
            <div className={styles.kpiIconWrapper}>
              <CreditCard size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>{quotas.length} Institusi</div>
            <div className={styles.kpiSub}>100% Status aktif valid</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Kapasitas Siswa Terisi</span>
            <div className={styles.kpiIconWrapper}>
              <Users size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              {quotas.reduce((a, b) => a + b.current_students, 0).toLocaleString('id-ID')} /{' '}
              {quotas.reduce((a, b) => a + b.max_students, 0).toLocaleString('id-ID')}
            </div>
            <div className={styles.kpiSub}>
              Utilisasi rata-rata:{' '}
              {Math.round(
                (quotas.reduce((a, b) => a + b.current_students, 0) /
                  quotas.reduce((a, b) => a + b.max_students, 0)) *
                  100
              )}
              %
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Penyimpanan Terpakai</span>
            <div className={styles.kpiIconWrapper}>
              <HardDrive size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              {quotas.reduce((a, b) => a + b.used_storage_gb, 0).toFixed(1)} GB /{' '}
              {quotas.reduce((a, b) => a + b.max_storage_gb, 0)} GB
            </div>
            <div className={styles.kpiSub}>Media &amp; Dokumen Rapor Cloud</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Paket Layanan Dominan</span>
            <div className={styles.kpiIconWrapper}>
              <Package size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ fontSize: '18px' }}>Institutional Pro</div>
            <div className={styles.kpiSub}>Paket standar pendidikan</div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari institusi atau tier lisensi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {filtered.length} dari {quotas.length} institusi terdaftar
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Institusi &amp; Tier</th>
                <th style={{ width: '22%' }}>Utilisasi Kuota Siswa</th>
                <th style={{ width: '20%' }}>Alokasi Cloud Storage</th>
                <th style={{ width: '18%' }}>Modul Fitur Aktif</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Konfigurasi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const studentPct = Math.round((item.current_students / item.max_students) * 100);
                const storagePct = Math.round((item.used_storage_gb / item.max_storage_gb) * 100);

                return (
                  <tr key={item.tenant_id} className={styles.tableRow}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {item.school_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={styles.npsnBadge}>{item.tier}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Exp: {item.expires_at}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.current_students} / {item.max_students} Siswa
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{studentPct}%</span>
                        </div>
                        <div className={styles.progressBarTrack} style={{ height: '5px' }}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${studentPct}%`,
                              background: studentPct > 85 ? '#ef4444' : '#10b981',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.used_storage_gb} GB / {item.max_storage_gb} GB
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{storagePct}%</span>
                        </div>
                        <div className={styles.progressBarTrack} style={{ height: '5px' }}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${storagePct}%`,
                              background: '#3b82f6',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span
                          className={styles.npsnBadge}
                          style={{
                            background: item.modules.lms ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                            color: item.modules.lms ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          LMS
                        </span>
                        <span
                          className={styles.npsnBadge}
                          style={{
                            background: item.modules.cbt ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                            color: item.modules.cbt ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          CBT
                        </span>
                        <span
                          className={styles.npsnBadge}
                          style={{
                            background: item.modules.dapodik ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                            color: item.modules.dapodik ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          Dapodik
                        </span>
                        <span
                          className={styles.npsnBadge}
                          style={{
                            background: item.modules.qr_presence ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                            color: item.modules.qr_presence ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          Presensi QR
                        </span>
                        <span
                          className={styles.npsnBadge}
                          style={{
                            background: item.modules.finance ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)',
                            color: item.modules.finance ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          SPP
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={styles.portalLaunchBtn}
                        onClick={() => setSelectedItem(item)}
                        title="Sesuaikan batas kuota dan fitur"
                      >
                        <SlidersHorizontal size={12} />
                        <span>Atur Kuota</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Quota */}
      {selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <SlidersHorizontal size={16} />
                  Atur Kuota &amp; Modul Tenant
                </h2>
                <p className={styles.modalSubtitle}>
                  Institusi: <strong>{selectedItem.school_name}</strong>
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setSelectedItem(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Tier Paket Layanan</label>
                <select
                  className={styles.fieldSelect}
                  value={selectedItem.tier}
                  onChange={(e) => setSelectedItem({ ...selectedItem, tier: e.target.value as any })}
                >
                  <option value="Enterprise Dedicated">Enterprise Dedicated</option>
                  <option value="Institutional Pro">Institutional Pro</option>
                  <option value="Standard Education">Standard Education</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Batas Maksimal Siswa</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={selectedItem.max_students}
                    onChange={(e) => setSelectedItem({ ...selectedItem, max_students: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Batas Penyimpanan Cloud (GB)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={selectedItem.max_storage_gb}
                    onChange={(e) => setSelectedItem({ ...selectedItem, max_storage_gb: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.formDivider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>Hak Akses Modul Platform</span>
                <div className={styles.dividerLine} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'lms', label: 'E-Learning & LMS Bahan Ajar' },
                  { key: 'cbt', label: 'CBT Ujian Online & Analisis Butir Soal' },
                  { key: 'dapodik', label: 'Gateway Dapodik Kemendikbud Sync' },
                  { key: 'qr_presence', label: 'Presensi Siswa QR & GPS Geofencing' },
                  { key: 'finance', label: 'Manajemen Keuangan SPP & Kas Sekolah' },
                ].map((mod) => (
                  <label
                    key={mod.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <span>{mod.label}</span>
                    <input
                      type="checkbox"
                      checked={(selectedItem.modules as any)[mod.key]}
                      onChange={(e) =>
                        setSelectedItem({
                          ...selectedItem,
                          modules: {
                            ...selectedItem.modules,
                            [mod.key]: e.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setSelectedItem(null)}>
                  Batal
                </button>
                <button type="submit" className={styles.submitModalBtn}>
                  Simpan Perubahan Kuota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
