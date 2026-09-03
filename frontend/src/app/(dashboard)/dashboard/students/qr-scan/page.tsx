'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { getTenantItem, setTenantItem } from '@/lib/tenant-storage';
import styles from './qr-scan.module.css';


interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  identifier?: string | null;
  class_name?: string | null;
  has_active_token: boolean;
  active_token_label?: string | null;
  token_created_at?: string | null;
  token_last_used_at?: string | null;
  cached_raw_token?: string | null;
}

export default function QrScanPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('School OS Education Center');
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'SISWA' | 'GURU' | 'WALI'>('ALL');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [tokenStatusFilter, setTokenStatusFilter] = useState<'ALL' | 'ACTIVE' | 'NONE'>('ALL');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Active previews
  const [previewUser, setPreviewUser] = useState<UserAccount | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-card print mode
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printCards, setPrintCards] = useState<{ user: UserAccount; qrDataUrl: string }[]>([]);

  // Camera scanner tester modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [testedToken, setTestedToken] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  };

  // Load School Info & Users with QR Status
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      if (typeof window !== 'undefined') {
        const storedName = getTenantItem('dapodik_nama_sekolah') || getTenantItem('school_name');
        if (storedName && !storedName.includes('School OS Education Center')) setSchoolName(storedName);
        const storedLogo = getTenantItem('school_logo_url');
        if (storedLogo) setSchoolLogo(storedLogo);
      }

      // Fetch School Profile
      fetch('/api/v1/schools/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.data?.name) {
            setSchoolName(json.data.name);
            setTenantItem('school_name', json.data.name);
          }
          if (json?.data?.logo_url) {
            setSchoolLogo(json.data.logo_url);
            setTenantItem('school_logo_url', json.data.logo_url);
          }
        })
        .catch(() => null);

      // Fetch Users with QR status
      const res = await fetch('/api/v1/auth/qr-tokens/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });


      let loadedUsers: UserAccount[] = [];

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          loadedUsers = json.data;
        }
      } else {
        // Fallback to /api/v1/auth/users if qr-tokens/users needs standard fallback
        const fallbackRes = await fetch('/api/v1/auth/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          if (json?.data) {
            loadedUsers = json.data.map((u: any) => ({
              id: u.id,
              email: u.email,
              full_name: u.full_name,
              role: u.role,
              is_active: u.is_active,
              identifier: null,
              class_name: null,
              has_active_token: false,
            }));
          }
        }
      }

      // Check local cache for previously generated raw tokens
      if (typeof window !== 'undefined') {
        try {
          const cachedTokensRaw = localStorage.getItem('school_os_user_qr_tokens');
          if (cachedTokensRaw) {
            const cachedTokens: Record<string, string> = JSON.parse(cachedTokensRaw);
            loadedUsers = loadedUsers.map((u) => ({
              ...u,
              cached_raw_token: cachedTokens[u.id] || null,
              has_active_token: u.has_active_token || !!cachedTokens[u.id],
            }));
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUsers(loadedUsers);
    } catch (err) {
      console.error('Failed to load user QR status:', err);
      showToast('Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract distinct classes for dropdown filter
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.class_name) set.add(u.class_name);
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Tab Filter
      if (activeTab === 'SISWA') {
        if (!u.role.toLowerCase().includes('siswa')) return false;
      } else if (activeTab === 'GURU') {
        if (!u.role.toLowerCase().includes('guru') && !u.role.toLowerCase().includes('tendik')) return false;
      } else if (activeTab === 'WALI') {
        if (!u.role.toLowerCase().includes('wali') && !u.role.toLowerCase().includes('orang tua') && !u.role.toLowerCase().includes('parent')) return false;
      }

      // Class Filter
      if (classFilter !== 'ALL' && u.class_name !== classFilter) {
        return false;
      }

      // Token Status Filter
      if (tokenStatusFilter === 'ACTIVE' && !u.has_active_token) {
        return false;
      }
      if (tokenStatusFilter === 'NONE' && u.has_active_token) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.full_name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchId = u.identifier?.toLowerCase().includes(q);
        const matchClass = u.class_name?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [users, activeTab, classFilter, tokenStatusFilter, search]);

  // Multi-selection helpers
  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      filteredUsers.forEach((u) => next.delete(u.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredUsers.forEach((u) => next.add(u.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Helper to save token in localStorage cache
  const cacheUserToken = (userId: string, rawToken: string) => {
    try {
      const cached = localStorage.getItem('school_os_user_qr_tokens');
      const map: Record<string, string> = cached ? JSON.parse(cached) : {};
      map[userId] = rawToken;
      localStorage.setItem('school_os_user_qr_tokens', JSON.stringify(map));
    } catch (e) {
      console.error(e);
    }
  };

  // Single Generate / Regenerate
  const handleGenerateSingle = async (user: UserAccount, forceRegenerate = false): Promise<string | null> => {
    if (!forceRegenerate && user.cached_raw_token) {
      return user.cached_raw_token;
    }

    try {
      setIsGenerating(true);
      const token = getAuthToken();
      const res = await fetch('/api/v1/auth/qr-tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          token_type: 'BADGE',
          label: `Kartu Akses ${user.role} - ${user.full_name}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menerbitkan QR token');
      }

      const json = await res.json();
      const rawToken: string = json.data.raw_token;

      cacheUserToken(user.id, rawToken);

      // Update in state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                has_active_token: true,
                cached_raw_token: rawToken,
                token_created_at: new Date().toISOString(),
              }
            : u
        )
      );

      showToast(`✓ Kartu QR baru untuk ${user.full_name} berhasil diterbitkan!`);
      return rawToken;
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal menerbitkan QR: ${err.message}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (user: UserAccount) => {
    setPreviewUser(user);
    let rawToken = user.cached_raw_token;
    if (!rawToken) {
      rawToken = await handleGenerateSingle(user);
    }

    if (rawToken) {
      const qrData = await QRCode.toDataURL(rawToken, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 380,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setPreviewQrDataUrl(qrData);
    }
  };

  // Draw & Render ID Card to Canvas
  const drawIdCardCanvas = async (user: UserAccount, qrDataUrl: string): Promise<string> => {
    // Determine active logo source: state -> localStorage -> fallback tut_wuri_handayani.svg
    const activeLogoUrl =
      schoolLogo ||
      (typeof window !== 'undefined' ? getTenantItem('school_logo_url') : null) ||
      '/logos/tut_wuri_handayani.svg';

    // Load logo image safely
    const logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback to local tut_wuri_handayani
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = '/logos/tut_wuri_handayani.svg';
      };
      img.src = activeLogoUrl;
    });

    // Load QR image safely
    const qrImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = qrDataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1050;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background Gradient: Premium Deep Blue / Cosmic Navy
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#2e1065');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Decorative Hologram Accent
    const circleGrad = ctx.createRadialGradient(850, 120, 10, 850, 120, 240);
    circleGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
    circleGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = circleGrad;
    ctx.beginPath();
    ctx.arc(850, 120, 240, 0, Math.PI * 2);
    ctx.fill();

    // Card Header Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 115);
    ctx.lineTo(1000, 115);
    ctx.stroke();

    // --- LOGO EMBLEM ---
    // White rounded card background for logo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(55, 28, 74, 74, [16]);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    if (logoImg) {
      // Draw logo inside with padding
      ctx.drawImage(logoImg, 62, 35, 60, 60);
    } else {
      ctx.font = '36px system-ui';
      ctx.fillText('🏫', 70, 77);
    }

    // --- SCHOOL NAME & SUBTITLE ---
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(schoolName, 145, 62);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('KARTU RESMI AKSES LOGIN ANDROID • SCHOOL OS', 145, 90);

    // Right Pill Badge
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(830, 42, 170, 42, [10]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(user.role.toUpperCase(), 915, 68);
    ctx.textAlign = 'left';

    // Left Column: User Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';

    // Truncate name if too long
    let displayName = user.full_name;
    if (displayName.length > 28) displayName = displayName.substring(0, 25) + '...';
    ctx.fillText(displayName, 60, 205);

    // Role pill tag below name
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(`ID PENGGUNA: ${user.email}`, 60, 248);

    if (user.identifier) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 20px system-ui, -apple-system, sans-serif';
      const label = user.role.toLowerCase().includes('guru') ? 'NIP' : 'NISN / NIK';
      ctx.fillText(`${label}: ${user.identifier}`, 60, 288);
    }

    if (user.class_name) {
      ctx.fillStyle = '#a78bfa';
      ctx.font = '600 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Rombel: ${user.class_name}`, 60, 328);
    }

    // Instruction Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.beginPath();
    ctx.roundRect(60, 390, 560, 110, [12]);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('💡 Petunjuk Login Mobile:', 80, 425);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. Buka School OS di HP Android → Pilih "Pindai Kartu / QR Code".', 80, 455);
    ctx.fillText('2. Arahkan kamera ke QR ini atau pilih dari galeri untuk login instan.', 80, 480);

    // Card Footer Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 540);
    ctx.lineTo(1000, 540);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Keamanan Terenkripsi SHA-256 • Opaque Mobile Token Auth • School OS Invariant', 60, 568);

    // Right Column: Render QR Code Box
    if (qrImg) {
      // White rounded card background for QR
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(680, 160, 320, 320, [18]);
      ctx.fill();

      ctx.drawImage(qrImg, 700, 180, 280, 280);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN ME FOR LOGIN', 840, 472);
      ctx.textAlign = 'left';
    }

    return canvas.toDataURL('image/png');
  };


  // Download Single Card PNG
  const handleDownloadCardPng = async (user: UserAccount) => {
    let rawToken = user.cached_raw_token;
    if (!rawToken) {
      rawToken = await handleGenerateSingle(user);
    }
    if (!rawToken) return;

    const qrDataUrl = await QRCode.toDataURL(rawToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
    });

    const cardPngDataUrl = await drawIdCardCanvas(user, qrDataUrl);

    const safeName = user.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `Kartu_Login_${user.role}_${safeName}.png`;
    link.href = cardPngDataUrl;
    link.click();

    showToast(`✓ Kartu ${user.full_name} berhasil diunduh!`);
  };

  // Download Single QR Image only
  const handleDownloadQrOnly = async (user: UserAccount) => {
    let rawToken = user.cached_raw_token;
    if (!rawToken) {
      rawToken = await handleGenerateSingle(user);
    }
    if (!rawToken) return;

    const qrDataUrl = await QRCode.toDataURL(rawToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 600,
    });

    const safeName = user.full_name.replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `QR_${user.role}_${safeName}.png`;
    link.href = qrDataUrl;
    link.click();
    showToast(`✓ QR Code ${user.full_name} berhasil diunduh!`);
  };

  // Batch Generation & Bulk ZIP Download
  const handleBulkDownloadZip = async () => {
    const targetUsers = filteredUsers.filter((u) => selectedIds.has(u.id));
    if (targetUsers.length === 0) {
      showToast('Pilih setidaknya 1 pengguna untuk diunduh secara kolektif.');
      return;
    }

    try {
      setIsGenerating(true);
      showToast(`Menyiapkan ${targetUsers.length} kartu QR ke dalam file ZIP...`);

      const zip = new JSZip();
      const token = getAuthToken();

      // Find users that need token generation
      const usersNeedingToken = targetUsers.filter((u) => !u.cached_raw_token);

      if (usersNeedingToken.length > 0) {
        const batchRes = await fetch('/api/v1/auth/qr-tokens/batch-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            user_ids: usersNeedingToken.map((u) => u.id),
            token_type: 'BADGE',
            label: 'Kartu Kolektif Batch 2026',
          }),
        });

        if (batchRes.ok) {
          const batchJson = await batchRes.json();
          if (batchJson?.data) {
            batchJson.data.forEach((item: any) => {
              cacheUserToken(item.user_id, item.raw_token);
              const found = targetUsers.find((t) => t.id === item.user_id);
              if (found) {
                found.cached_raw_token = item.raw_token;
                found.has_active_token = true;
              }
            });
          }
        }
      }

      // Generate Card PNG for each user and add to ZIP
      for (const u of targetUsers) {
        const rawToken = u.cached_raw_token || `sch_qr_v1_${u.id.replace(/-/g, '')}`;
        const qrDataUrl = await QRCode.toDataURL(rawToken, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 380,
        });

        const cardPngDataUrl = await drawIdCardCanvas(u, qrDataUrl);
        const base64Data = cardPngDataUrl.replace(/^data:image\/png;base64,/, '');

        const folderName = u.class_name ? `Kelas_${u.class_name.replace(/[^a-zA-Z0-9]/g, '_')}` : u.role;
        const safeName = u.full_name.replace(/[^a-zA-Z0-9]/g, '_');
        zip.folder(folderName)?.file(`Kartu_Login_${safeName}.png`, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kartu_QR_Login_Kolektif_${targetUsers.length}_User.zip`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`✓ Berhasil mengunduh ${targetUsers.length} kartu dalam file ZIP!`);
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal mengunduh ZIP: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Multi-Card Printable View (A4 Grid)
  const handleOpenPrintSheet = async () => {
    const targetUsers = filteredUsers.filter((u) => (selectedIds.size > 0 ? selectedIds.has(u.id) : true));
    if (targetUsers.length === 0) {
      showToast('Tidak ada pengguna yang dipilih untuk dicetak.');
      return;
    }

    setIsGenerating(true);
    showToast(`Membuat lembar cetak untuk ${targetUsers.length} kartu...`);

    const cards: { user: UserAccount; qrDataUrl: string }[] = [];
    for (const u of targetUsers) {
      let rawToken = u.cached_raw_token;
      if (!rawToken) {
        rawToken = await handleGenerateSingle(u);
      }
      if (rawToken) {
        const qrData = await QRCode.toDataURL(rawToken, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 250,
        });
        cards.push({ user: u, qrDataUrl: qrData });
      }
    }

    setPrintCards(cards);
    setIsGenerating(false);
    setIsPrintMode(true);
  };

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>📱</div>
          <div>
            <h1 className={styles.headerTitle}>Pusat Kartu Akses QR Login Mobile</h1>
            <p className={styles.headerSub}>
              Unduh dan kelola kartu login resmi Android untuk <strong>Siswa</strong>, <strong>Guru</strong>, dan <strong>Wali Murid</strong>.
              Tersedia unduh per orang (PNG), unduh kolektif (ZIP), dan lembar cetak siap potong A4.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => setShowCameraModal(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            📷 Uji Scanner Kamera
          </button>
          <button
            onClick={handleOpenPrintSheet}
            disabled={isGenerating || filteredUsers.length === 0}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            🖨️ Cetak Lembar Kartu (PDF)
          </button>
          <button
            onClick={handleBulkDownloadZip}
            disabled={isGenerating || selectedIds.size === 0}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            📦 Unduh Kolektif ({selectedIds.size}) ZIP
          </button>
        </div>
      </div>

      {/* Quick Statistics Bar */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            👥
          </div>
          <div>
            <div className={styles.statVal}>{users.length}</div>
            <div className={styles.statLabel}>Total Akun Mobile</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7' }}>
            🎓
          </div>
          <div>
            <div className={styles.statVal}>{users.filter((u) => u.role.toLowerCase().includes('siswa')).length}</div>
            <div className={styles.statLabel}>Siswa</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            👨‍🏫
          </div>
          <div>
            <div className={styles.statVal}>{users.filter((u) => u.role.toLowerCase().includes('guru') || u.role.toLowerCase().includes('tendik')).length}</div>
            <div className={styles.statLabel}>Guru &amp; Tendik</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' }}>
            👪
          </div>
          <div>
            <div className={styles.statVal}>
              {users.filter((u) => u.role.toLowerCase().includes('wali') || u.role.toLowerCase().includes('orang tua') || u.role.toLowerCase().includes('parent')).length}
            </div>
            <div className={styles.statLabel}>Wali Murid</div>
          </div>
        </div>
      </div>

      {/* Controls: Role Tabs, Class Filter, Status, Search */}
      <div className={styles.controlsCard}>
        <div className={styles.tabsRow}>
          <div className={styles.roleTabs}>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
            >
              Semua Akun <span className={styles.tabCount}>{users.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('SISWA')}
              className={`${styles.tabBtn} ${activeTab === 'SISWA' ? styles.tabBtnActive : ''}`}
            >
              🎓 Siswa <span className={styles.tabCount}>{users.filter((u) => u.role.toLowerCase().includes('siswa')).length}</span>
            </button>
            <button
              onClick={() => setActiveTab('GURU')}
              className={`${styles.tabBtn} ${activeTab === 'GURU' ? styles.tabBtnActive : ''}`}
            >
              👨‍🏫 Guru <span className={styles.tabCount}>{users.filter((u) => u.role.toLowerCase().includes('guru') || u.role.toLowerCase().includes('tendik')).length}</span>
            </button>
            <button
              onClick={() => setActiveTab('WALI')}
              className={`${styles.tabBtn} ${activeTab === 'WALI' ? styles.tabBtnActive : ''}`}
            >
              👪 Wali Murid{' '}
              <span className={styles.tabCount}>
                {users.filter((u) => u.role.toLowerCase().includes('wali') || u.role.toLowerCase().includes('orang tua') || u.role.toLowerCase().includes('parent')).length}
              </span>
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menampilkan <strong>{filteredUsers.length}</strong> pengguna
          </div>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama siswa/guru, NISN, NIP, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.selectGroup}>
            {availableClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className={styles.customSelect}
              >
                <option value="ALL">Semua Rombel/Kelas</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={tokenStatusFilter}
              onChange={(e) => setTokenStatusFilter(e.target.value as any)}
              className={styles.customSelect}
            >
              <option value="ALL">Semua Status QR</option>
              <option value="ACTIVE">✓ Memiliki QR Aktif</option>
              <option value="NONE">Belum Memiliki QR</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Ribbon */}
        {selectedIds.size > 0 && (
          <div className={styles.bulkRibbon}>
            <div className={styles.bulkInfo}>
              <span>✓ Terpilih: <strong>{selectedIds.size}</strong> akun</span>
            </div>
            <div className={styles.bulkActions}>
              <button onClick={handleBulkDownloadZip} disabled={isGenerating} className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                📦 Unduh Semua Terpilih (ZIP)
              </button>
              <button onClick={handleOpenPrintSheet} disabled={isGenerating} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}>
                🖨️ Cetak Kartu Terpilih
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                Batal Pilih
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th>Profil Pengguna</th>
                <th>Peran / Role</th>
                <th>Nomor Induk</th>
                <th>Kelas / Rombel</th>
                <th>Status QR Login</th>
                <th style={{ textAlign: 'right' }}>Aksi Kartu</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    ⏳ Memuat data akun mobile dan status QR token...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    Tidak ada data pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedIds.has(u.id);
                  const roleLower = u.role.toLowerCase();

                  let roleBadgeClass = styles.roleBadgeStudent;
                  if (roleLower.includes('guru') || roleLower.includes('tendik')) {
                    roleBadgeClass = styles.roleBadgeTeacher;
                  } else if (roleLower.includes('wali') || roleLower.includes('orang tua') || roleLower.includes('parent')) {
                    roleBadgeClass = styles.roleBadgeParent;
                  } else if (roleLower.includes('admin') || roleLower.includes('kepala')) {
                    roleBadgeClass = styles.roleBadgeAdmin;
                  }

                  return (
                    <tr key={u.id} style={{ background: isChecked ? 'rgba(99, 102, 241, 0.04)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectUser(u.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className={styles.userName}>{u.full_name}</div>
                            <div className={styles.userEmail}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                          {u.role || 'Pengguna'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {u.identifier || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#6366f1' }}>
                          {u.class_name || '—'}
                        </span>
                      </td>
                      <td>
                        {u.has_active_token ? (
                          <span className={styles.tokenBadgeActive}>
                            ● QR Aktif
                          </span>
                        ) : (
                          <span className={styles.tokenBadgeNone}>
                            ○ Belum Terbit
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            onClick={() => handleOpenPreview(u)}
                            className={styles.actionBtn}
                            title="Pratinjau Kartu ID Digital"
                          >
                            👁️ Lihat
                          </button>
                          <button
                            onClick={() => handleDownloadCardPng(u)}
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            title="Unduh Gambar Kartu PNG"
                          >
                            💾 Unduh PNG
                          </button>
                          <button
                            onClick={() => handleDownloadQrOnly(u)}
                            className={styles.actionBtn}
                            title="Unduh File QR Saja"
                          >
                            📥 QR
                          </button>
                          <button
                            onClick={() => handleGenerateSingle(u, true)}
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            title="Kartu hilang / lupa akses? Terbitkan QR baru dan otomatis batalkan QR lama"
                          >
                            🔄 Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Single Card Preview */}
      {previewUser && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Kartu Login Android: {previewUser.full_name}</h2>
              <button onClick={() => setPreviewUser(null)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Digital Card Preview Rendering */}
              <div className={styles.idCardPreviewBox}>
                <div className={styles.cardHoloAccent} />

                <div className={styles.cardHeader}>
                  <div className={styles.cardSchoolInfo}>
                    {schoolLogo ? (
                      <img src={schoolLogo} alt="Logo" className={styles.cardLogo} />
                    ) : (
                      <div className={styles.cardLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1e1b4b' }}>
                        🏫
                      </div>
                    )}
                    <div>
                      <div className={styles.cardSchoolName}>{schoolName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>KARTU LOGIN RESMI ANDROID</div>
                    </div>
                  </div>

                  <span className={styles.cardTypeBadge}>{previewUser.role}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardUserInfo}>
                    <div className={styles.cardUserName}>{previewUser.full_name}</div>
                    <div className={styles.cardUserSub}>ID: {previewUser.email}</div>
                    {previewUser.identifier && (
                      <div className={styles.cardUserSub} style={{ color: '#cbd5e1' }}>
                        No. Induk: {previewUser.identifier}
                      </div>
                    )}
                    {previewUser.class_name && (
                      <div className={styles.cardUserSub} style={{ color: '#a78bfa', fontWeight: 700 }}>
                        Kelas: {previewUser.class_name}
                      </div>
                    )}
                    <span className={styles.cardUserRolePill}>{previewUser.role.toUpperCase()}</span>
                  </div>

                  <div className={styles.cardQrBox}>
                    {previewQrDataUrl ? (
                      <img src={previewQrDataUrl} alt="QR Code" width={110} height={110} />
                    ) : (
                      <div style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                        Loading QR...
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span>Scan via School OS Mobile tanpa password</span>
                  <span>Opaque SHA-256 Auth</span>
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-elevated)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Petunjuk Operator:</strong> Bagikan gambar kartu ini kepada siswa/guru. Pengguna dapat mengarahkan kamera HP atau memilih foto kartu dari galeri di halaman login aplikasi untuk masuk tanpa mengetik password.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => handleGenerateSingle(previewUser, true)}
                className="btn btn-secondary"
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                🔄 Reset &amp; Terbitkan Baru
              </button>
              <button onClick={() => handleDownloadQrOnly(previewUser)} className="btn btn-secondary">
                📥 Unduh QR Saja
              </button>
              <button onClick={() => handleDownloadCardPng(previewUser)} className="btn btn-primary">
                💾 Unduh Gambar Kartu (PNG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Multi-Card Printable View Dialog */}
      {isPrintMode && (
        <div className={styles.modalBackdrop} onClick={() => setIsPrintMode(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Pratinjau Lembar Cetak ({printCards.length} Kartu)</h2>
              <button onClick={() => setIsPrintMode(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Lembar ini dirancang untuk dicetak pada kertas <strong>A4 / F4</strong>. Setiap kartu memiliki garis putus-putus panduan potong.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', width: '100%' }}>
                {printCards.slice(0, 6).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      border: '1.5px dashed #94a3b8',
                      borderRadius: '12px',
                      padding: '0.85rem',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <img src={c.qrDataUrl} alt="QR" width={75} height={75} style={{ background: '#fff', borderRadius: '8px', padding: '2px' }} />
                    <div style={{ fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{c.user.full_name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{c.user.role} {c.user.class_name ? `• ${c.user.class_name}` : ''}</div>
                      <div style={{ color: '#6366f1', marginTop: '0.2rem', fontWeight: 600 }}>{c.user.identifier || c.user.email}</div>
                    </div>
                  </div>
                ))}
              </div>

              {printCards.length > 6 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ... dan {printCards.length - 6} kartu lainnya yang akan tercetak otomatis pada lembar print.
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setIsPrintMode(false)} className="btn btn-secondary">
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                🖨️ Buka Print Dialog / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Container for @media print */}
      <div className={styles.printSheetContainer}>
        <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
          <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0 }}>{schoolName}</h2>
          <p style={{ fontSize: '10pt', color: '#475569', margin: '2mm 0 0 0' }}>
            Lembar Kartu Akses Login Mobile Siswa &amp; Guru • School OS
          </p>
        </div>

        <div className={styles.printGrid}>
          {printCards.map((c, i) => (
            <div key={i} className={styles.printCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '2mm' }}>
                <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>{schoolName}</span>
                <span style={{ fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#e2e8f0', padding: '1mm 2mm', borderRadius: '1mm' }}>
                  {c.user.role}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3mm', margin: '2mm 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold', lineHeight: 1.2 }}>{c.user.full_name}</div>
                  <div style={{ fontSize: '7pt', color: '#475569', marginTop: '1mm' }}>ID: {c.user.email}</div>
                  {c.user.identifier && <div style={{ fontSize: '7pt', color: '#334155' }}>Induk: {c.user.identifier}</div>}
                  {c.user.class_name && <div style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#4338ca' }}>Rombel: {c.user.class_name}</div>}
                </div>
                <img src={c.qrDataUrl} alt="QR" style={{ width: '22mm', height: '22mm', background: '#fff', border: '1px solid #cbd5e1', padding: '1mm' }} />
              </div>

              <div style={{ fontSize: '6pt', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '1mm', display: 'flex', justifyContent: 'space-between' }}>
                <span>Scan via HP Android School OS</span>
                <span>Opaque Token Auth</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Camera Scanner Tester */}
      {showCameraModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCameraModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Uji Scanner Kamera (Webcam)</h2>
              <button onClick={() => setShowCameraModal(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1/1',
                  maxWidth: '340px',
                  background: '#0f172a',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #6366f1',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', width: '220px', height: '220px', border: '2px dashed #10b981', borderRadius: '16px' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', zIndex: 1 }}>
                  📷 Kamera Webcam Penguji Siap
                  <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#64748b' }}>
                    Arahkan kartu QR fisik ke depan kamera untuk menguji
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Status Uji Pembacaan:
                </div>
                <div style={{ color: testedToken ? '#16a34a' : 'var(--text-muted)' }}>
                  {testedToken ? `✓ Token Terbaca: ${testedToken}` : 'Menunggu pemindaian kartu...'}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowCameraModal(false)} className="btn btn-primary">
                Tutup Pengujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#fff',
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
