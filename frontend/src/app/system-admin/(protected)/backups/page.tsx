'use client';

import React, { useState } from 'react';
import styles from '../dashboard/system.module.css';
import {
  Archive,
  HardDrive,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Database,
  Calendar,
  AlertTriangle,
  X,
} from 'lucide-react';

type SnapshotItem = {
  id: string;
  name: string;
  type: 'Full Cluster' | 'Tenant Isolasi' | 'Skema Sistem';
  target: string;
  size: string;
  created_at: string;
  status: 'Tersedia' | 'Memproses';
  checksum: string;
};

const INITIAL_SNAPSHOTS: SnapshotItem[] = [
  {
    id: 'snap-20261008-01',
    name: 'Auto-Snapshot Harian Cluster Prod',
    type: 'Full Cluster',
    target: 'Semua Tenant (PostgreSQL 16)',
    size: '142.8 MB',
    created_at: '2026-10-08T02:00:00Z',
    status: 'Tersedia',
    checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'snap-20261007-01',
    name: 'Auto-Snapshot Harian Cluster Prod',
    type: 'Full Cluster',
    target: 'Semua Tenant (PostgreSQL 16)',
    size: '139.4 MB',
    created_at: '2026-10-07T02:00:00Z',
    status: 'Tersedia',
    checksum: 'sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
  {
    id: 'snap-20261006-02',
    name: 'Pra-Migrasi Skema Dapodik V2',
    type: 'Skema Sistem',
    target: 'Struktur DDL & Indeks',
    size: '12.6 MB',
    created_at: '2026-10-06T18:30:00Z',
    status: 'Tersedia',
    checksum: 'sha256:b5a2c96250612366ac8b22a0f6b67e3405401552b87c45f4153313091309830a',
  },
  {
    id: 'snap-20261005-01',
    name: 'Backup Manual Tenant SMA Negeri 1',
    type: 'Tenant Isolasi',
    target: 'SMA Negeri 1 Indonesia',
    size: '48.1 MB',
    created_at: '2026-10-05T09:15:00Z',
    status: 'Tersedia',
    checksum: 'sha256:03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  },
];

export default function SystemBackupsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(INITIAL_SNAPSHOTS);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Full Cluster' as 'Full Cluster' | 'Tenant Isolasi' | 'Skema Sistem',
    target: 'Semua Tenant',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    setTimeout(() => {
      const newSnap: SnapshotItem = {
        id: `snap-${Date.now().toString().slice(-8)}`,
        name: formData.name || 'Snapshot Manual Ad-Hoc',
        type: formData.type,
        target: formData.target,
        size: '144.2 MB',
        created_at: new Date().toISOString(),
        status: 'Tersedia',
        checksum: `sha256:${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      };

      setSnapshots([newSnap, ...snapshots]);
      setIsCreating(false);
      setShowCreateModal(false);
      setFormData({ name: '', type: 'Full Cluster', target: 'Semua Tenant' });
      showToast('Snapshot database berhasil dibuat dan diverifikasi.');
    }, 1200);
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    if (confirm(`Hapus snapshot "${name}" secara permanen dari penyimpanan cold storage?`)) {
      setSnapshots(snapshots.filter((s) => s.id !== id));
      showToast(`Snapshot ${name} berhasil dihapus.`);
    }
  };

  const filtered = snapshots.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.target.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
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
          <h1 className={styles.title}>Cadangan &amp; Pemulihan Basis Data</h1>
          <p className={styles.subtitle}>
            Kelola snapshot PostgreSQL, replikasi data multi-tenant, dan pemulihan bencana (*Disaster Recovery*).
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>Automated Daily Backup: Pukul 02:00 WIB</span>
          </div>

          <button
            className={styles.primaryActionBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>Buat Snapshot Baru</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Snapshot</span>
            <div className={styles.kpiIconWrapper}>
              <Archive size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>{snapshots.length} Arsip</div>
            <div className={styles.kpiSub}>Tersimpan di cold storage</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Ukuran Cadangan Kumulatif</span>
            <div className={styles.kpiIconWrapper}>
              <HardDrive size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>342.9 MB</div>
            <div className={styles.kpiSub}>Kompresi gzip pg_dump</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Kebijakan Retensi</span>
            <div className={styles.kpiIconWrapper}>
              <Calendar size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>30 Hari</div>
            <div className={styles.kpiSub}>Rotasi otomatis terjadwal</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Integritas Checksum</span>
            <div className={styles.kpiIconWrapper} style={{ color: '#10b981' }}>
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue} style={{ color: '#10b981' }}>100% Lolos</div>
            <div className={styles.kpiSub}>Verifikasi SHA-256 valid</div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama snapshot atau target…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {filtered.length} dari {snapshots.length} snapshot tersedia
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Nama Snapshot &amp; ID</th>
                <th style={{ width: '18%' }}>Tipe &amp; Cakupan</th>
                <th style={{ width: '15%' }}>Ukuran File</th>
                <th style={{ width: '15%' }}>Waktu Pembuatan</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {item.name}
                      </span>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.id} • {item.checksum.substring(0, 18)}…
                      </code>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={styles.npsnBadge} style={{ alignSelf: 'flex-start' }}>
                        {item.type}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.target}</span>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                      {item.size}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.tableActions}>
                      <button
                        className={styles.portalLaunchBtn}
                        onClick={() => showToast(`Mengunduh file arsip ${item.id}.sql.gz…`)}
                        title="Unduh file dump SQL"
                      >
                        <Download size={12} />
                        <span>Unduh Dump</span>
                      </button>

                      <button
                        className={styles.actionIconButton}
                        onClick={() => {
                          if (confirm(`Pulihkan basis data dari titik snapshot ${item.name}? Peringatan: Data yang belum tercadangkan akan ditimpa.`)) {
                            showToast(`Proses pemulihan dari snapshot ${item.id} dijadwalkan.`);
                          }
                        }}
                        title="Pulihkan dari titik ini (Restore Point)"
                      >
                        <RotateCcw size={13} />
                      </button>

                      <button
                        className={styles.actionIconButton}
                        onClick={() => handleDeleteSnapshot(item.id, item.name)}
                        title="Hapus snapshot permanen"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Snapshot */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <HardDrive size={16} />
                  Buat Snapshot Basis Data Ad-Hoc
                </h2>
                <p className={styles.modalSubtitle}>
                  Perintah eksekusi <code>pg_dump</code> aman tanpa mengunci tabel operasional tenant.
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setShowCreateModal(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Label / Nama Snapshot</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pra-Pembaruan Semester Ganjil"
                  className={styles.fieldInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Cakupan Pencadangan</label>
                <select
                  className={styles.fieldSelect}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Full Cluster">Full Cluster (Seluruh Institusi &amp; Sistem)</option>
                  <option value="Tenant Isolasi">Tenant Tertentu (Spesifik Institusi)</option>
                  <option value="Skema Sistem">Hanya Skema DDL &amp; Definisi Tabel</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Target Spesifik</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Semua Tenant / Nama Institusi"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowCreateModal(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.submitModalBtn} disabled={isCreating}>
                  {isCreating ? 'Mengeksekusi Dump…' : 'Mulai Pencadangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
