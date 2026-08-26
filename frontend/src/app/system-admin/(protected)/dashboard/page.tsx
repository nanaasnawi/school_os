'use client';

import React, { useState, useEffect } from 'react';
import styles from './system.module.css';

type TenantItem = {
  tenant_id: string;
  tenant_name: string;
  school_name: string | null;
  npsn: string | null;
  is_active: boolean;
  created_at: string;
  server_status: string;
  student_count: number;
  teacher_count: number;
  class_count: number;
  is_dapodik_connected: boolean;
};

type SystemOverview = {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_guardians: number;
  outbox_pending_events: number;
  server_engine: string;
  rust_version: string;
  database_status: string;
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
];

export default function SystemAdminPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dapodik' | 'suspended'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showNewSchoolModal, setShowNewSchoolModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);

  // Form Data for Existing Tenant Master Account
  const [masterFormData, setMasterFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role_name: 'Kepala Sekolah',
  });

  // Form Data for Resetting Credentials
  const [resetFormData, setResetFormData] = useState({
    current_email: '',
    new_email: '',
    new_password: '',
  });

  // Form Data for New School & Tenant Registration
  const [newSchoolFormData, setNewSchoolFormData] = useState({
    school_name: '',
    npsn: '',
    master_full_name: '',
    master_email: '',
    master_password: '',
    master_role: 'Kepala Sekolah',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const getInitials = (name: string) => {
    if (!name) return 'SO';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const [tenantsRes, overviewRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/system/tenants', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/v1/system/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data.data || []);
      }

      if (overviewRes && overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData.data || null);
      }
    } catch (e) {
      console.error(e);
      showToast('Koneksi server database terputus.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenMasterModal = (t: TenantItem) => {
    setSelectedTenant(t);
    setMasterFormData({
      email: `admin@${t.tenant_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.sch.id`,
      password: generateRandomPassword(),
      full_name: 'Kepala Sekolah',
      role_name: 'Kepala Sekolah'
    });
    setShowMasterModal(true);
  };

  const handleOpenResetModal = (t: TenantItem) => {
    setSelectedTenant(t);
    setResetFormData({
      current_email: '',
      new_email: '',
      new_password: generateRandomPassword()
    });
    setShowResetModal(true);
  };

  const handleOpenDetailModal = (t: TenantItem) => {
    setSelectedTenant(t);
    setShowDetailModal(true);
  };

  const handleToggleStatus = async (t: TenantItem) => {
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch(`http://localhost:8000/api/v1/system/tenants/${t.tenant_id}/toggle-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`✓ Status server tenant ${t.tenant_name} berhasil diubah!`, 'success');
        fetchDashboardData();
      } else {
        showToast('Gagal mengubah status tenant.', 'error');
      }
    } catch (e) {
      showToast('Koneksi server gagal.', 'error');
    }
  };

  const handleImpersonateTenant = async (t: TenantItem) => {
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch(`http://localhost:8000/api/v1/system/tenants/${t.tenant_id}/impersonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userToken = data.data?.token;
        if (userToken) {
          localStorage.setItem('auth_token', userToken);
          localStorage.setItem('token', userToken);
          localStorage.setItem('active_tenant_id', t.tenant_id);
          showToast(`✓ Berhasil terautentikasi sebagai Admin ${t.tenant_name}! Membuka Dashboard...`, 'success');
          setTimeout(() => {
            window.open('/dashboard', '_blank');
          }, 600);
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.error?.message || 'Gagal masuk portal tenant. Pastikan akun master sudah aktif.', 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch(`http://localhost:8000/api/v1/system/tenants/${selectedTenant.tenant_id}/activate-master`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(masterFormData)
      });

      if (res.ok) {
        showToast(`✓ Akun ${masterFormData.role_name} untuk ${selectedTenant.tenant_name} berhasil dibuat!`, 'success');
        setShowMasterModal(false);
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        showToast(`Gagal: ${errorData.error?.message || 'Terjadi kesalahan pada database.'}`, 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const payload: any = { current_email: resetFormData.current_email };
      if (resetFormData.new_email) payload.new_email = resetFormData.new_email;
      if (resetFormData.new_password) payload.new_password = resetFormData.new_password;

      const res = await fetch(`http://localhost:8000/api/v1/system/tenants/${selectedTenant.tenant_id}/reset-credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`✓ Kredensial akun untuk ${selectedTenant.tenant_name} berhasil direset!`, 'success');
        setShowResetModal(false);
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        showToast(`Gagal reset: ${errorData.error?.message || 'Email tidak ditemukan.'}`, 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const res = await fetch('http://localhost:8000/api/v1/system/tenants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchoolFormData)
      });

      if (res.ok) {
        showToast(`✓ Registrasi sekolah & tenant ${newSchoolFormData.school_name} berhasil disiapkan!`, 'success');
        setShowNewSchoolModal(false);
        setNewSchoolFormData({
          school_name: '',
          npsn: '',
          master_full_name: '',
          master_email: '',
          master_password: '',
          master_role: 'Kepala Sekolah',
        });
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        showToast(`Gagal: ${errorData.error?.message || 'Gagal membuat tenant sekolah baru.'}`, 'error');
      }
    } catch (e) {
      showToast('Koneksi server gagal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.school_name && t.school_name.toLowerCase().includes(search.toLowerCase())) ||
      (t.npsn && t.npsn.includes(search)) ||
      t.tenant_id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return t.is_active;
    if (statusFilter === 'suspended') return !t.is_active;
    if (statusFilter === 'dapodik') return t.is_dapodik_connected;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toast} ${toastType === 'success' ? styles.toastSuccess : styles.toastError}`}>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tenant Command Center</h1>
          <p className={styles.subtitle}>
            Pantau direktori sekolah, status server terisolasi, dan kelola otorisasi akun Master secara terpusat.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchDashboardData}
            title="Muat ulang data"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            🔄 Refresh
          </button>
          <button
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              fontWeight: 700,
            }}
            onClick={() => {
              setNewSchoolFormData({
                school_name: '',
                npsn: '',
                master_full_name: 'Kepala Sekolah',
                master_email: 'admin@sekolah.sch.id',
                master_password: generateRandomPassword(),
                master_role: 'Kepala Sekolah',
              });
              setShowNewSchoolModal(true);
            }}
          >
            + Registrasi Sekolah Baru
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>🏢</div>
          <div>
            <div className={styles.kpiVal}>{overview ? overview.total_tenants : tenants.length}</div>
            <div className={styles.kpiLabel}>Total Tenant Terdaftar</div>
            <div className={styles.kpiSub}>🟢 {overview ? overview.active_tenants : tenants.filter(t => t.is_active).length} Aktif Normal</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>👥</div>
          <div>
            <div className={styles.kpiVal}>{overview ? overview.total_students : tenants.reduce((a, b) => a + (b.student_count || 0), 0)}</div>
            <div className={styles.kpiLabel}>Total Peserta Didik</div>
            <div className={styles.kpiSub}>Agregasi Seluruh Sekolah</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>👨‍🏫</div>
          <div>
            <div className={styles.kpiVal}>{overview ? overview.total_teachers : tenants.reduce((a, b) => a + (b.teacher_count || 0), 0)}</div>
            <div className={styles.kpiLabel}>Total Guru &amp; GTK</div>
            <div className={styles.kpiSub}>Tersinkron Master Data</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' }}>⚡</div>
          <div>
            <div className={styles.kpiVal}>&lt; 5ms</div>
            <div className={styles.kpiLabel}>Rust Core Latency</div>
            <div className={styles.kpiSub}>99.99% Target Uptime</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(8, 145, 178, 0.12)', color: '#0891b2' }}>🔄</div>
          <div>
            <div className={styles.kpiVal}>{overview ? overview.outbox_pending_events : 0}</div>
            <div className={styles.kpiLabel}>Outbox Pending</div>
            <div className={styles.kpiSub}>100% Event Dispatched</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Filter Pills, Search, and View Switcher */}
      <div className={styles.toolbar}>
        <div className={styles.filterPills}>
          <button 
            className={`${styles.filterPill} ${statusFilter === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Semua ({tenants.length})
          </button>
          <button 
            className={`${styles.filterPill} ${statusFilter === 'active' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            🟢 Aktif ({tenants.filter(t => t.is_active).length})
          </button>
          <button 
            className={`${styles.filterPill} ${statusFilter === 'dapodik' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('dapodik')}
          >
            🔄 Dapodik Live ({tenants.filter(t => t.is_dapodik_connected).length})
          </button>
          <button 
            className={`${styles.filterPill} ${statusFilter === 'suspended' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('suspended')}
          >
            🔴 Suspend ({tenants.filter(t => !t.is_active).length})
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari sekolah, NPSN, atau UUID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            className={styles.viewToggleBtn}
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            title="Ganti tampilan tabel / kartu"
          >
            {viewMode === 'table' ? '⊞ Grid' : '☰ Tabel'}
          </button>
        </div>
      </div>

      {/* Main Tenant Content */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Memuat direktori tenant dari database PostgreSQL...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>Tidak ada sekolah yang cocok dengan filter pencarian.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ── CLEAN TABLE VIEW ── */
        <div className={styles.tableCard}>
          <table className={styles.modernTable}>
            <thead>
              <tr>
                <th style={{ width: '42%' }}>PROFIL SEKOLAH &amp; TENANT</th>
                <th style={{ width: '25%' }}>KAPASITAS DATA</th>
                <th style={{ width: '13%' }}>STATUS SERVER</th>
                <th style={{ width: '20%', textAlign: 'right' }}>AKSI KELOLA</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t, idx) => (
                <tr key={t.tenant_id}>
                  {/* Column 1: School Identity */}
                  <td>
                    <div className={styles.tenantIdentity}>
                      <div 
                        className={styles.schoolAvatar}
                        style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}
                      >
                        {getInitials(t.school_name || t.tenant_name)}
                      </div>

                      <div className={styles.tenantInfo}>
                        <div className={styles.schoolName}>
                          {t.school_name || t.tenant_name}
                        </div>

                        <div className={styles.tenantMetaRow}>
                          {t.npsn ? (
                            <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                              NPSN: {t.npsn}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NPSN: -</span>
                          )}

                          {t.is_dapodik_connected && (
                            <span className="badge badge-active" style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                              ✓ Dapodik Live
                            </span>
                          )}

                          <button
                            className={styles.uuidChip}
                            onClick={() => {
                              navigator.clipboard.writeText(t.tenant_id);
                              showToast(`✓ UUID ${t.tenant_id} disalin!`, 'success');
                            }}
                            title="Salin UUID Tenant Lengkap"
                          >
                            <span>{t.tenant_id.substring(0, 8)}...</span>
                            <span>📋</span>
                          </button>

                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Dibuat {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Data Capacity Badges */}
                  <td>
                    <div className={styles.statPillsRow}>
                      <div className={`${styles.statPill} ${styles.statPillBlue}`} title="Jumlah Siswa Terdaftar">
                        <span>👥</span>
                        <span>{t.student_count || 0} Siswa</span>
                      </div>
                      <div className={`${styles.statPill} ${styles.statPillGreen}`} title="Jumlah Pendidik / GTK">
                        <span>👨‍🏫</span>
                        <span>{t.teacher_count || 0} GTK</span>
                      </div>
                      <div className={`${styles.statPill} ${styles.statPillAmber}`} title="Jumlah Rombongan Belajar">
                        <span>🏫</span>
                        <span>{t.class_count || 0} Rombel</span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Server Status */}
                  <td>
                    <div className={styles.serverStatusBox}>
                      <span className={t.is_active ? styles.statusPillActive : styles.statusPillSuspended}>
                        <span>●</span>
                        <span>{t.is_active ? 'Online' : 'Suspend'}</span>
                      </span>
                      <button
                        onClick={() => handleToggleStatus(t)}
                        title={t.is_active ? 'Tangguhkan (Suspend) Server Tenant' : 'Aktifkan Kembali Server Tenant'}
                        className={styles.toggleBtn}
                      >
                        {t.is_active ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </td>

                  {/* Column 4: Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionsRow}>
                      <button
                        className={styles.portalBtn}
                        onClick={() => handleImpersonateTenant(t)}
                        title="Bypass Login ke Dashboard Sekolah ini secara instan"
                      >
                        <span>🚀</span>
                        <span>Buka Portal</span>
                      </button>

                      <button
                        className={styles.actionBtnSecondary}
                        onClick={() => handleOpenMasterModal(t)}
                        title="Buat Akun Master Baru untuk Sekolah"
                      >
                        <span>🔑</span>
                        <span>Akun Master</span>
                      </button>

                      <button
                        className={styles.actionBtnSecondary}
                        onClick={() => handleOpenResetModal(t)}
                        title="Reset Kredensial Pengguna"
                      >
                        <span>🔄</span>
                      </button>

                      <button
                        className={styles.actionBtnSecondary}
                        onClick={() => handleOpenDetailModal(t)}
                        title="Detail Resource & Database"
                      >
                        <span>🔍</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── GRID CARD VIEW ── */
        <div className={styles.cardGrid}>
          {filteredTenants.map((t, idx) => (
            <div key={t.tenant_id} className={styles.tenantCard}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className={styles.tenantIdentity}>
                    <div 
                      className={styles.schoolAvatar}
                      style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}
                    >
                      {getInitials(t.school_name || t.tenant_name)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {t.school_name || t.tenant_name}
                      </h3>
                      <button
                        className={styles.uuidChip}
                        style={{ marginTop: '0.3rem' }}
                        onClick={() => {
                          navigator.clipboard.writeText(t.tenant_id);
                          showToast(`✓ UUID ${t.tenant_id} disalin!`, 'success');
                        }}
                      >
                        <span>{t.tenant_id.substring(0, 8)}...</span>
                        <span>📋</span>
                      </button>
                    </div>
                  </div>

                  <span className={t.is_active ? styles.statusPillActive : styles.statusPillSuspended}>
                    <span>●</span>
                    <span>{t.is_active ? 'Online' : 'Suspend'}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {t.npsn ? (
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      NPSN: {t.npsn}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NPSN: Belum diatur</span>
                  )}
                  {t.is_dapodik_connected && (
                    <span className="badge badge-active" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      ✓ Dapodik Live
                    </span>
                  )}
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563eb' }}>{t.student_count || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Siswa</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>{t.teacher_count || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Guru</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#d97706' }}>{t.class_count || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rombel</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <button
                  className={styles.portalBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleImpersonateTenant(t)}
                >
                  🚀 Buka Portal
                </button>
                <button
                  className={styles.actionBtnSecondary}
                  onClick={() => handleOpenMasterModal(t)}
                  title="Buat Akun Master"
                >
                  🔑
                </button>
                <button
                  className={styles.actionBtnSecondary}
                  onClick={() => handleOpenResetModal(t)}
                  title="Reset Kredensial"
                >
                  🔄
                </button>
                <button
                  className={styles.actionBtnSecondary}
                  onClick={() => handleOpenDetailModal(t)}
                  title="Detail"
                >
                  🔍
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: Buat Akun Master ── */}
      {showMasterModal && selectedTenant && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🔑 Buat Akun Master Sekolah</h2>
              <button className={styles.closeBtn} onClick={() => setShowMasterModal(false)}>✕</button>
            </div>
            <p className={styles.modalSubtitle}>
              Sekolah: <strong>{selectedTenant.school_name || selectedTenant.tenant_name}</strong>
            </p>

            <form onSubmit={handleSaveMaster}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Peran Akun (Role)</label>
                <select
                  className={styles.formInput}
                  value={masterFormData.role_name}
                  onChange={(e) => setMasterFormData({ ...masterFormData, role_name: e.target.value })}
                >
                  <option value="Kepala Sekolah">Kepala Sekolah (Akses Penuh Akademik &amp; Eksekutif)</option>
                  <option value="Operator/Staff">Operator Sekolah / Staf Tata Usaha</option>
                  <option value="Bendahara">Bendahara &amp; Pengelola Keuangan</option>
                  <option value="Guru">Guru Pengajar &amp; Wali Kelas</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Lengkap Pengguna</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: H. Ahmad Dahlan, M.Pd"
                  className={styles.formInput}
                  value={masterFormData.full_name}
                  onChange={(e) => setMasterFormData({ ...masterFormData, full_name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Alamat Email Login</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className={styles.formInput}
                  value={masterFormData.email}
                  onChange={(e) => setMasterFormData({ ...masterFormData, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className={styles.formLabel}>Password Login Baru</label>
                  <button
                    type="button"
                    onClick={() => setMasterFormData({ ...masterFormData, password: generateRandomPassword() })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🎲 Buat Password Acak
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={masterFormData.password}
                  onChange={(e) => setMasterFormData({ ...masterFormData, password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMasterModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Simpan & Aktifkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Reset Kredensial ── */}
      {showResetModal && selectedTenant && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🔄 Reset Kredensial Akun</h2>
              <button className={styles.closeBtn} onClick={() => setShowResetModal(false)}>✕</button>
            </div>
            <p className={styles.modalSubtitle}>
              Reset email atau password untuk akun di <strong>{selectedTenant.school_name || selectedTenant.tenant_name}</strong>
            </p>

            <form onSubmit={handleResetCredentials}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Pengguna yang Ingin Direset</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.com"
                  className={styles.formInput}
                  value={resetFormData.current_email}
                  onChange={(e) => setResetFormData({ ...resetFormData, current_email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Baru (Opsional)</label>
                <input
                  type="email"
                  placeholder="Kosongkan jika tidak ingin mengubah email"
                  className={styles.formInput}
                  value={resetFormData.new_email}
                  onChange={(e) => setResetFormData({ ...resetFormData, new_email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className={styles.formLabel}>Password Baru (Opsional)</label>
                  <button
                    type="button"
                    onClick={() => setResetFormData({ ...resetFormData, new_password: generateRandomPassword() })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🎲 Buat Password Acak
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className={styles.formInput}
                  value={resetFormData.new_password}
                  onChange={(e) => setResetFormData({ ...resetFormData, new_password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Kredensial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Registrasi Sekolah Baru ── */}
      {showNewSchoolModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🏫 Registrasi Sekolah &amp; Master Baru</h2>
              <button className={styles.closeBtn} onClick={() => setShowNewSchoolModal(false)}>✕</button>
            </div>
            <p className={styles.modalSubtitle}>
              Sistem akan otomatis mengisolasi database tenant dan menyiapkan peran bawaan standar.
            </p>

            <form onSubmit={handleCreateNewSchool}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Sekolah Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Negeri 1 Indonesia"
                  className={styles.formInput}
                  value={newSchoolFormData.school_name}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, school_name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nomor Pokok Sekolah Nasional (NPSN)</label>
                <input
                  type="text"
                  required
                  placeholder="8 Digit NPSN Resmi (Contoh: 20101234)"
                  className={styles.formInput}
                  value={newSchoolFormData.npsn}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, npsn: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', margin: '1.25rem 0', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-dark, #0284c7)', textTransform: 'uppercase' }}>
                  Kredensial Akun Master Utama
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Kepala Sekolah / Pimpinan</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap & Gelar"
                  className={styles.formInput}
                  value={newSchoolFormData.master_full_name}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_full_name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Login Master</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className={styles.formInput}
                  value={newSchoolFormData.master_email}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className={styles.formLabel}>Password Login Awal</label>
                  <button
                    type="button"
                    onClick={() => setNewSchoolFormData({ ...newSchoolFormData, master_password: generateRandomPassword() })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🎲 Buat Password Acak
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={newSchoolFormData.master_password}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewSchoolModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Mendaftarkan...' : 'Buat Tenant & Sekolah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Detail Tenant & Resource Monitor ── */}
      {showDetailModal && selectedTenant && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🔍 Detail Resource Tenant</h2>
              <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nama Sekolah / Tenant</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedTenant.school_name || selectedTenant.tenant_name}
                </div>
                <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-dark, #0284c7)' }}>{selectedTenant.tenant_id}</code>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.9rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NPSN Sekolah</span>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {selectedTenant.npsn || 'Belum diatur'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.9rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Koneksi Dapodik</span>
                  <div style={{ fontWeight: 800, color: selectedTenant.is_dapodik_connected ? '#10b981' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selectedTenant.is_dapodik_connected ? '✓ Terhubung Port 5774' : 'Belum Konfigurasi'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Alokasi Resource Database:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.6rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2563eb' }}>{selectedTenant.student_count || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Siswa</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>{selectedTenant.teacher_count || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>GTK / Guru</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#d97706' }}>{selectedTenant.class_count || 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rombel</div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-primary" onClick={() => setShowDetailModal(false)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
