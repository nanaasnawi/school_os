'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/api';
import styles from './system.module.css';
import {
  Building2,
  Users,
  GraduationCap,
  Zap,
  Inbox,
  RefreshCw,
  Plus,
  Search,
  LayoutGrid,
  List,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  RotateCcw,
  Sliders,
  Pause,
  Play,
  X,
  Dices,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

// Refined enterprise palette for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

// Animated Counter Hook
function useAnimatedCounter(target: number, duration = 600) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

function AnimatedValue({ value }: { value: number | string }) {
  const numVal = typeof value === 'number' ? value : parseInt(value as string) || 0;
  const animated = useAnimatedCounter(numVal);
  if (typeof value === 'string' && isNaN(parseInt(value))) return <>{value}</>;
  return <>{animated.toLocaleString('id-ID')}</>;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.chartTooltip}>
        <div className={styles.chartTooltipTitle}>{label}</div>
        {payload.map((entry: any, i: number) => (
          <div key={i} className={styles.chartTooltipRow}>
            <span className={styles.chartTooltipDot} style={{ background: entry.fill || entry.color }} />
            <span className={styles.chartTooltipLabel}>{entry.name}</span>
            <span className={styles.chartTooltipValue}>{entry.value.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className={styles.chartTooltip}>
        <div className={styles.chartTooltipTitle}>{item.name}</div>
        <div className={styles.chartTooltipRow}>
          <span className={styles.chartTooltipDot} style={{ background: item.payload.fill }} />
          <span className={styles.chartTooltipLabel}>Peserta Didik</span>
          <span className={styles.chartTooltipValue}>{item.value.toLocaleString('id-ID')}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SystemAdminPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dapodik' | 'suspended'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showNewSchoolModal, setShowNewSchoolModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);

  // Form Data
  const [masterFormData, setMasterFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role_name: 'Kepala Sekolah',
  });

  const [resetFormData, setResetFormData] = useState({
    current_email: '',
    new_email: '',
    new_password: '',
  });

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
    if (!name) return 'AE';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`UUID ${text} berhasil disalin ke clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    if (tenants.length === 0) setIsLoading(true);
    try {
      const token = localStorage.getItem('sysAdminToken');
      const [tenantsRes, overviewRes] = await Promise.all([
        fetch(getApiUrl('/api/v1/system/tenants'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/api/v1/system/overview'), {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data.data || []);
      }

      if (overviewRes && overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData.data || null);
      }

      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
      showToast('Koneksi server database terputus.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      role_name: 'Kepala Sekolah',
    });
    setShowMasterModal(true);
  };

  const handleOpenResetModal = (t: TenantItem) => {
    setSelectedTenant(t);
    setResetFormData({
      current_email: '',
      new_email: '',
      new_password: generateRandomPassword(),
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
      const res = await fetch(getApiUrl(`/api/v1/system/tenants/${t.tenant_id}/toggle-status`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Status server tenant ${t.tenant_name} berhasil diperbarui.`, 'success');
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
      const res = await fetch(getApiUrl(`/api/v1/system/tenants/${t.tenant_id}/impersonate`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userToken = data.data?.token;
        if (userToken) {
          localStorage.setItem('auth_token', userToken);
          localStorage.setItem('token', userToken);
          localStorage.setItem('active_tenant_id', t.tenant_id);
          showToast(`Berhasil autentikasi sebagai Admin ${t.tenant_name}. Membuka Dashboard...`, 'success');
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
      const res = await fetch(getApiUrl(`/api/v1/system/tenants/${selectedTenant.tenant_id}/activate-master`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(masterFormData),
      });

      if (res.ok) {
        showToast(`Akun ${masterFormData.role_name} untuk ${selectedTenant.tenant_name} berhasil diaktifkan.`, 'success');
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

      const res = await fetch(getApiUrl(`/api/v1/system/tenants/${selectedTenant.tenant_id}/reset-credentials`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Kredensial akun untuk ${selectedTenant.tenant_name} berhasil diperbarui.`, 'success');
        setShowResetModal(false);
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        showToast(`Gagal: ${errorData.error?.message || 'Email tidak ditemukan.'}`, 'error');
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
      const res = await fetch(getApiUrl('/api/v1/system/tenants'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchoolFormData),
      });

      if (res.ok) {
        showToast(`Sekolah & tenant ${newSchoolFormData.school_name} berhasil didaftarkan.`, 'success');
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

  const filteredTenants = tenants.filter((t) => {
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

  const barChartData = tenants.map((t) => ({
    name: t.school_name
      ? t.school_name.length > 16
        ? t.school_name.substring(0, 16) + '…'
        : t.school_name
      : t.tenant_name,
    Siswa: t.student_count || 0,
    GTK: t.teacher_count || 0,
    Rombel: t.class_count || 0,
  }));

  const pieChartData = tenants
    .filter((t) => (t.student_count || 0) > 0)
    .map((t, i) => ({
      name: t.school_name
        ? t.school_name.length > 20
          ? t.school_name.substring(0, 20) + '…'
          : t.school_name
        : t.tenant_name,
      value: t.student_count || 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const totalStudents = overview ? overview.total_students : tenants.reduce((a, b) => a + (b.student_count || 0), 0);
  const totalTeachers = overview ? overview.total_teachers : tenants.reduce((a, b) => a + (b.teacher_count || 0), 0);
  const totalTenants = overview ? overview.total_tenants : tenants.length;
  const activeTenants = overview ? overview.active_tenants : tenants.filter((t) => t.is_active).length;
  const outboxPending = overview ? overview.outbox_pending_events : 0;

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toast} ${toastType === 'success' ? styles.toastSuccess : styles.toastError}`}>
            {toastType === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Direktori &amp; Metrik Tenant</h1>
          <p className={styles.subtitle}>
            Pantau direktori institusi pendidikan, kondisi basis data terisolasi, dan otoritas akun Master.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>
              Terakhir diperbarui {lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            className={styles.refreshBtn}
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            title="Muat ulang data telemetri"
          >
            <RefreshCw size={13} className={isRefreshing ? styles.spinIcon : ''} />
            <span>{isRefreshing ? 'Menyinkronkan' : 'Perbarui'}</span>
          </button>

          <button
            className={styles.primaryActionBtn}
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
            <Plus size={14} strokeWidth={2.2} />
            <span>Registrasi Sekolah Baru</span>
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <section className={styles.kpiGrid} aria-label="Ringkasan Utama Platform">
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Total Tenant</span>
            <div className={styles.kpiIconWrapper}>
              <Building2 size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              <AnimatedValue value={totalTenants} />
            </div>
            <div className={styles.kpiSub}>
              <span className={styles.kpiSubActive}>● {activeTenants}</span> Aktif normal
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Peserta Didik</span>
            <div className={styles.kpiIconWrapper}>
              <Users size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              <AnimatedValue value={totalStudents} />
            </div>
            <div className={styles.kpiSub}>Agregasi seluruh institusi</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Pendidik &amp; GTK</span>
            <div className={styles.kpiIconWrapper}>
              <GraduationCap size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              <AnimatedValue value={totalTeachers} />
            </div>
            <div className={styles.kpiSub}>Tenaga kependidikan aktif</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Rust Core Latency</span>
            <div className={styles.kpiIconWrapper}>
              <Zap size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>&lt; 5ms</div>
            <div className={styles.kpiSub}>Target uptime 99.99%</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Antrean Outbox</span>
            <div className={styles.kpiIconWrapper}>
              <Inbox size={14} />
            </div>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValue}>
              <AnimatedValue value={outboxPending} />
            </div>
            <div className={styles.kpiSub}>
              {outboxPending === 0 ? 'Semua event terdistribusi' : `${outboxPending} menunggu dispatch`}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      {!isLoading && tenants.length > 0 && (
        <section className={styles.analyticsSection} aria-label="Visualisasi Distribusi Data">
          <div className={styles.analyticsSectionHeader}>
            <h2 className={styles.analyticsSectionTitle}>
              <Layers size={15} />
              Distribusi Data &amp; Kapasitas Platform
            </h2>
            <div className={styles.analyticsLiveBadge}>
              <span className={styles.liveDot} />
              <span>Telemetri Real-time</span>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            {/* Bar Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartCardTitle}>Distribusi Data per Sekolah</div>
                <div className={styles.chartCardSub}>Komparasi Siswa, GTK, dan Rombongan Belajar</div>
              </div>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barChartData} margin={{ top: 8, right: 12, left: -24, bottom: 4 }} barSize={12} barGap={3}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border-light, #e2e8f0)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--text-muted, #64748b)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted, #64748b)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--bg-elevated, #f1f5f9)', opacity: 0.5 }} />
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary, #475569)', paddingTop: '6px' }}
                    />
                    <Bar dataKey="Siswa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="GTK" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rombel" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartCardTitle}>Proporsi Siswa per Institusi</div>
                <div className={styles.chartCardSub}>Distribusi populasi peserta didik</div>
              </div>
              {pieChartData.length > 0 ? (
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={700}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary, #475569)', paddingTop: '6px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.donutCenter}>
                    <div className={styles.donutCenterVal}>{totalStudents.toLocaleString('id-ID')}</div>
                    <div className={styles.donutCenterLabel}>Total Siswa</div>
                  </div>
                </div>
              ) : (
                <div className={styles.chartEmpty}>
                  <span>Belum ada data agregasi siswa</span>
                </div>
              )}
            </div>

            {/* Health & Summary */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartCardTitle}>Ringkasan Eksekutif</div>
                <div className={styles.chartCardSub}>Total objek dan kesiapan infrastruktur</div>
              </div>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>{totalTenants}</span>
                  <span className={styles.summaryItemLabel}>Tenant</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>{totalStudents}</span>
                  <span className={styles.summaryItemLabel}>Siswa</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>{totalTeachers}</span>
                  <span className={styles.summaryItemLabel}>GTK</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>
                    {overview?.total_classes ?? tenants.reduce((a, b) => a + (b.class_count || 0), 0)}
                  </span>
                  <span className={styles.summaryItemLabel}>Rombel</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>{overview?.total_guardians ?? 0}</span>
                  <span className={styles.summaryItemLabel}>Wali</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemVal}>{outboxPending}</span>
                  <span className={styles.summaryItemLabel}>Outbox</span>
                </div>
              </div>

              <div className={styles.tenantProgressBar}>
                <div className={styles.progressBarLegend}>
                  <span>Ketersediaan Tenant</span>
                  <span>{activeTenants} / {totalTenants} Aktif</span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: totalTenants > 0 ? `${(activeTenants / totalTenants) * 100}%` : '0%',
                    }}
                  />
                </div>
                <div className={styles.progressBarLegend} style={{ fontSize: '10px' }}>
                  <span>Aktif: {activeTenants}</span>
                  <span>Ditangguhkan: {totalTenants - activeTenants}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Toolbar: Filters, Search, View Mode */}
      <div className={styles.toolbar}>
        <div className={styles.filterPills}>
          <button
            className={`${styles.filterPill} ${statusFilter === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>Semua</span>
            <span className={styles.filterCount}>({tenants.length})</span>
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'active' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span style={{ color: '#10b981' }}>●</span>
            <span>Aktif</span>
            <span className={styles.filterCount}>({tenants.filter((t) => t.is_active).length})</span>
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'dapodik' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('dapodik')}
          >
            <span>Dapodik Sinkron</span>
            <span className={styles.filterCount}>({tenants.filter((t) => t.is_dapodik_connected).length})</span>
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'suspended' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('suspended')}
          >
            <span style={{ color: '#ef4444' }}>●</span>
            <span>Ditangguhkan</span>
            <span className={styles.filterCount}>({tenants.filter((t) => !t.is_active).length})</span>
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari nama, NPSN, atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
              aria-label="Table view"
            >
              <List size={15} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Tampilan Grid Kartu"
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tenant List / Table */}
      {isLoading ? (
        <div className={styles.stateContainer}>
          <div className={styles.spinner} />
          <span>Memuat direktori tenant dari database Akselerasi-Edu...</span>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className={styles.stateContainer}>
          <span>Tidak ada sekolah yang sesuai dengan parameter pencarian.</span>
        </div>
      ) : viewMode === 'table' ? (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Institusi &amp; Metadata</th>
                  <th style={{ width: '25%' }}>Kapasitas Akademik</th>
                  <th style={{ width: '15%' }}>Status Server</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Otoritas &amp; Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => (
                  <tr key={t.tenant_id} className={styles.tableRow}>
                    {/* Identity */}
                    <td>
                      <div className={styles.tenantIdentity}>
                        <div className={styles.tenantAvatar}>
                          {getInitials(t.school_name || t.tenant_name)}
                        </div>
                        <div className={styles.tenantMeta}>
                          <div className={styles.tenantSchoolName}>
                            {t.school_name || t.tenant_name}
                          </div>
                          <div className={styles.tenantSubMeta}>
                            {t.npsn ? (
                              <span className={styles.npsnBadge}>NPSN {t.npsn}</span>
                            ) : (
                              <span style={{ opacity: 0.6 }}>NPSN: -</span>
                            )}

                            {t.is_dapodik_connected && (
                              <span className={styles.dapodikBadge} title="Koneksi WebService Dapodik terhubung">
                                <Check size={11} strokeWidth={2.5} />
                                Dapodik
                              </span>
                            )}

                            <button
                              className={styles.uuidCopyBtn}
                              onClick={() => copyToClipboard(t.tenant_id, t.tenant_id)}
                              title="Salin UUID Tenant Lengkap"
                            >
                              {copiedId === t.tenant_id ? (
                                <>
                                  <Check size={10} color="#10b981" />
                                  <span>Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <span>{t.tenant_id.substring(0, 8)}…</span>
                                  <Copy size={10} />
                                </>
                              )}
                            </button>

                            <span>
                              {new Date(t.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td>
                      <div className={styles.capacityGroup}>
                        <div className={styles.capacityItem} title="Jumlah Peserta Didik">
                          <span className={styles.capacityItemVal}>{(t.student_count || 0).toLocaleString('id-ID')}</span>
                          <span className={styles.capacityItemLabel}>Siswa</span>
                        </div>
                        <div className={styles.capacityItem} title="Jumlah Pendidik / GTK">
                          <span className={styles.capacityItemVal}>{(t.teacher_count || 0).toLocaleString('id-ID')}</span>
                          <span className={styles.capacityItemLabel}>GTK</span>
                        </div>
                        <div className={styles.capacityItem} title="Jumlah Rombongan Belajar">
                          <span className={styles.capacityItemVal}>{(t.class_count || 0).toLocaleString('id-ID')}</span>
                          <span className={styles.capacityItemLabel}>Rombel</span>
                        </div>
                      </div>
                    </td>

                    {/* Server Status */}
                    <td>
                      <div className={styles.statusContainer}>
                        <div className={`${styles.statusIndicator} ${t.is_active ? styles.statusOnline : styles.statusSuspended}`}>
                          <span className={styles.statusDot} />
                          <span>{t.is_active ? 'Online' : 'Suspend'}</span>
                        </div>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          title={t.is_active ? 'Tangguhkan status tenant' : 'Aktifkan kembali tenant'}
                          className={styles.statusToggleBtn}
                        >
                          {t.is_active ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.tableActions}>
                        <button
                          className={styles.portalLaunchBtn}
                          onClick={() => handleImpersonateTenant(t)}
                          title="Buka Dashboard Tenant secara langsung"
                        >
                          <span>Masuk Portal</span>
                          <ExternalLink size={12} />
                        </button>

                        <button
                          className={styles.actionIconButton}
                          onClick={() => handleOpenMasterModal(t)}
                          title="Kelola / Buat Akun Master"
                        >
                          <KeyRound size={13} />
                        </button>

                        <button
                          className={styles.actionIconButton}
                          onClick={() => handleOpenResetModal(t)}
                          title="Reset Kredensial Pengguna"
                        >
                          <RotateCcw size={13} />
                        </button>

                        <button
                          className={styles.actionIconButton}
                          onClick={() => handleOpenDetailModal(t)}
                          title="Detail Resource Basis Data"
                        >
                          <Sliders size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className={styles.cardGrid}>
          {filteredTenants.map((t) => (
            <div key={t.tenant_id} className={styles.tenantCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardHeader}>
                  <div className={styles.tenantIdentity}>
                    <div className={styles.tenantAvatar}>
                      {getInitials(t.school_name || t.tenant_name)}
                    </div>
                    <div className={styles.tenantMeta}>
                      <div className={styles.tenantSchoolName}>
                        {t.school_name || t.tenant_name}
                      </div>
                      <div className={styles.tenantSubMeta}>
                        {t.npsn ? <span className={styles.npsnBadge}>NPSN {t.npsn}</span> : null}
                        <button
                          className={styles.uuidCopyBtn}
                          onClick={() => copyToClipboard(t.tenant_id, t.tenant_id)}
                          title="Salin UUID"
                        >
                          <span>{t.tenant_id.substring(0, 8)}…</span>
                          <Copy size={9} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.statusIndicator} ${t.is_active ? styles.statusOnline : styles.statusSuspended}`}>
                    <span className={styles.statusDot} />
                    <span>{t.is_active ? 'Online' : 'Suspend'}</span>
                  </div>
                </div>

                <div className={styles.cardStatsGrid}>
                  <div>
                    <div className={styles.cardStatsVal}>{(t.student_count || 0).toLocaleString('id-ID')}</div>
                    <div className={styles.cardStatsLabel}>Siswa</div>
                  </div>
                  <div>
                    <div className={styles.cardStatsVal}>{(t.teacher_count || 0).toLocaleString('id-ID')}</div>
                    <div className={styles.cardStatsLabel}>GTK</div>
                  </div>
                  <div>
                    <div className={styles.cardStatsVal}>{(t.class_count || 0).toLocaleString('id-ID')}</div>
                    <div className={styles.cardStatsLabel}>Rombel</div>
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.portalLaunchBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleImpersonateTenant(t)}
                >
                  <span>Masuk Portal</span>
                  <ExternalLink size={12} />
                </button>
                <button
                  className={styles.actionIconButton}
                  onClick={() => handleOpenMasterModal(t)}
                  title="Akun Master"
                >
                  <KeyRound size={13} />
                </button>
                <button
                  className={styles.actionIconButton}
                  onClick={() => handleOpenResetModal(t)}
                  title="Reset Kredensial"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  className={styles.actionIconButton}
                  onClick={() => handleOpenDetailModal(t)}
                  title="Detail Resource"
                >
                  <Sliders size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Akun Master */}
      {showMasterModal && selectedTenant && (
        <div className={styles.modalOverlay} onClick={() => setShowMasterModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <KeyRound size={16} />
                  Aktivasi Akun Master
                </h2>
                <p className={styles.modalSubtitle}>
                  Institusi: <strong>{selectedTenant.school_name || selectedTenant.tenant_name}</strong>
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setShowMasterModal(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Peran Akun (Role)</label>
                <select
                  className={styles.fieldSelect}
                  value={masterFormData.role_name}
                  onChange={(e) => setMasterFormData({ ...masterFormData, role_name: e.target.value })}
                >
                  <option value="Kepala Sekolah">Kepala Sekolah (Akses Penuh Akademik &amp; Eksekutif)</option>
                  <option value="Operator/Staff">Operator Sekolah / Tata Usaha</option>
                  <option value="Bendahara">Bendahara &amp; Keuangan</option>
                  <option value="Guru">Guru Pengajar &amp; Wali Kelas</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Nama Lengkap Pejabat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. H. Ahmad Dahlan, M.Pd"
                  className={styles.fieldInput}
                  value={masterFormData.full_name}
                  onChange={(e) => setMasterFormData({ ...masterFormData, full_name: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Alamat Email Otoritas</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className={styles.fieldInput}
                  value={masterFormData.email}
                  onChange={(e) => setMasterFormData({ ...masterFormData, email: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <div className={styles.formFieldHeader}>
                  <label className={styles.fieldLabel}>Kata Sandi</label>
                  <button
                    type="button"
                    className={styles.fieldActionBtn}
                    onClick={() => setMasterFormData({ ...masterFormData, password: generateRandomPassword() })}
                  >
                    <Dices size={12} />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className={styles.fieldInput}
                  value={masterFormData.password}
                  onChange={(e) => setMasterFormData({ ...masterFormData, password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowMasterModal(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.submitModalBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses…' : 'Simpan &amp; Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Kredensial */}
      {showResetModal && selectedTenant && (
        <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <RotateCcw size={16} />
                  Perbarui Kredensial Akun
                </h2>
                <p className={styles.modalSubtitle}>
                  Perubahan kredensial untuk akun di <strong>{selectedTenant.school_name || selectedTenant.tenant_name}</strong>
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setShowResetModal(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetCredentials} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Email Pengguna Terdaftar</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className={styles.fieldInput}
                  value={resetFormData.current_email}
                  onChange={(e) => setResetFormData({ ...resetFormData, current_email: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Alamat Email Baru (Opsional)</label>
                <input
                  type="email"
                  placeholder="Kosongkan jika tidak ingin mengubah email"
                  className={styles.fieldInput}
                  value={resetFormData.new_email}
                  onChange={(e) => setResetFormData({ ...resetFormData, new_email: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <div className={styles.formFieldHeader}>
                  <label className={styles.fieldLabel}>Kata Sandi Baru (Opsional)</label>
                  <button
                    type="button"
                    className={styles.fieldActionBtn}
                    onClick={() => setResetFormData({ ...resetFormData, new_password: generateRandomPassword() })}
                  >
                    <Dices size={12} />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Kosongkan jika tidak ingin mengubah sandi"
                  className={styles.fieldInput}
                  value={resetFormData.new_password}
                  onChange={(e) => setResetFormData({ ...resetFormData, new_password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowResetModal(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.submitModalBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Memperbarui…' : 'Terapkan Kredensial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrasi Sekolah Baru */}
      {showNewSchoolModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewSchoolModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <Building2 size={16} />
                  Registrasi Sekolah &amp; Tenant Baru
                </h2>
                <p className={styles.modalSubtitle}>
                  Sistem akan menginisialisasi ruang lingkup isolasi basis data tenant secara otomatis.
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setShowNewSchoolModal(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewSchool} className={styles.modalForm}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Nama Lengkap Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Negeri 1 Indonesia"
                  className={styles.fieldInput}
                  value={newSchoolFormData.school_name}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, school_name: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Nomor Pokok Sekolah Nasional (NPSN)</label>
                <input
                  type="text"
                  required
                  placeholder="8 Digit NPSN resmi (Contoh: 20101234)"
                  className={styles.fieldInput}
                  value={newSchoolFormData.npsn}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, npsn: e.target.value })}
                />
              </div>

              <div className={styles.formDivider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>Kredensial Akun Master Awal</span>
                <div className={styles.dividerLine} />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Nama Pimpinan / Administrator</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap & Gelar"
                  className={styles.fieldInput}
                  value={newSchoolFormData.master_full_name}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_full_name: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Email Administrator</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  className={styles.fieldInput}
                  value={newSchoolFormData.master_email}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_email: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <div className={styles.formFieldHeader}>
                  <label className={styles.fieldLabel}>Kata Sandi Awal</label>
                  <button
                    type="button"
                    className={styles.fieldActionBtn}
                    onClick={() => setNewSchoolFormData({ ...newSchoolFormData, master_password: generateRandomPassword() })}
                  >
                    <Dices size={12} />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className={styles.fieldInput}
                  value={newSchoolFormData.master_password}
                  onChange={(e) => setNewSchoolFormData({ ...newSchoolFormData, master_password: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowNewSchoolModal(false)}>
                  Batal
                </button>
                <button type="submit" className={styles.submitModalBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Mendaftarkan…' : 'Daftarkan Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail Resource */}
      {showDetailModal && selectedTenant && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h2 className={styles.modalTitle}>
                  <Database size={16} />
                  Telemetri Resource Tenant
                </h2>
                <p className={styles.modalSubtitle}>
                  Informasi isolasi skema basis data dan kapasitas objek
                </p>
              </div>
              <button className={styles.closeModalBtn} onClick={() => setShowDetailModal(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.detailCard}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Nama Institusi</span>
                  <span className={styles.detailVal}>{selectedTenant.school_name || selectedTenant.tenant_name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Pengenal Unik (UUID)</span>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTenant.tenant_id}</code>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Nomor Pokok (NPSN)</span>
                  <span className={styles.detailVal}>{selectedTenant.npsn || 'Belum terkonfigurasi'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Integrasi Dapodik</span>
                  <span className={styles.detailVal} style={{ color: selectedTenant.is_dapodik_connected ? '#10b981' : 'var(--text-muted)' }}>
                    {selectedTenant.is_dapodik_connected ? 'Terhubung (WebService Aktif)' : 'Belum Terhubung'}
                  </span>
                </div>
              </div>

              <div className={styles.detailCard}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Alokasi Objek Basis Data
                </span>
                <div className={styles.detailRow} style={{ marginTop: '4px' }}>
                  <span className={styles.detailLabel}>Peserta Didik (Siswa)</span>
                  <span className={styles.detailVal}>{(selectedTenant.student_count || 0).toLocaleString('id-ID')} entitas</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tenaga Pendidik (GTK)</span>
                  <span className={styles.detailVal}>{(selectedTenant.teacher_count || 0).toLocaleString('id-ID')} akun</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Rombongan Belajar (Kelas)</span>
                  <span className={styles.detailVal}>{(selectedTenant.class_count || 0).toLocaleString('id-ID')} unit</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.submitModalBtn} onClick={() => setShowDetailModal(false)}>
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
