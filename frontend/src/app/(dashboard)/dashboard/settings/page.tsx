'use client';
import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';

import React, { useState, useEffect, useRef } from 'react';
import styles from './settings.module.css';

const KEMENDIKDASMEN_LOGO_URL = '/logos/tut_wuri_handayani.svg';
const KEMENAG_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Kementerian_Agama_Republik_Indonesia_logo.svg';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [namaSekolah, setNamaSekolah] = useState('');
  const [npsn, setNpsn] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [dapodikUrl, setDapodikUrl] = useState('http://localhost:5774');
  const [dapodikToken, setDapodikToken] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert Jumpshare web page links (/share/) to viewer links (/v/) if needed
  const getDirectImageUrl = (url: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.includes('jumpshare.com/share/')) {
      trimmed = trimmed.replace('jumpshare.com/share/', 'jumpshare.com/v/');
    }
    return trimmed;
  };

  const LOGO_PRESETS = [
    {
      id: 'default',
      name: 'Logo Default Sistem',
      url: '',
      icon: '🛡️',
      desc: 'Lambang Tameng Edukasi Bawaan Aplikasi'
    },
    {
      id: 'kemendikdasmen',
      name: 'Tut Wuri Handayani (Kemendikdasmen)',
      url: KEMENDIKDASMEN_LOGO_URL,
      icon: '🇮🇩',
      desc: 'Logo Resmi Kementerian Pendidikan Dasar dan Menengah'
    },
    {
      id: 'kemenag',
      name: 'Ikhlas Beramal (Kemenag / Madrasah)',
      url: KEMENAG_LOGO_URL,
      icon: '🕌',
      desc: 'Logo Resmi Kementerian Agama / Madrasah'
    }
  ];

  useEffect(() => {
    // 1. Load initial values from LocalStorage if available
    if (typeof window !== 'undefined') {
      setNamaSekolah(getTenantItem('dapodik_nama_sekolah') || '');
      setNpsn(getTenantItem('dapodik_npsn') || '');
      const savedLogo = getTenantItem('school_logo_url');
      if (savedLogo !== null) setLogoUrl(savedLogo);
    }

    // 2. Fetch active tenant's school profile from Server API
    async function fetchSchoolProfile() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/v1/schools/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            if (json.data.name) {
              setNamaSekolah(json.data.name);
              setTenantItem('dapodik_nama_sekolah', json.data.name);
            }
            if (json.data.npsn) {
              setNpsn(json.data.npsn);
              setTenantItem('dapodik_npsn', json.data.npsn);
            }
            if (json.data.logo_url) {
              setLogoUrl(json.data.logo_url);
              setTenantItem('school_logo_url', json.data.logo_url);
            } else {
              setLogoUrl('');
              removeTenantItem('school_logo_url');
            }
            if (json.data.dapodik_url) {
              setDapodikUrl(json.data.dapodik_url);
            }
            if (json.data.dapodik_token) {
              setDapodikToken(json.data.dapodik_token);
            }

            setStatusMessage('✓ Terhubung dengan Server Utama');
          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil sekolah dari server:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolProfile();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
          setLogoUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const directUrl = getDirectImageUrl(logoUrl);

    try {
      // 1. Save to LocalStorage for immediate UI responsiveness
      if (typeof window !== 'undefined') {
        setTenantItem('dapodik_nama_sekolah', namaSekolah);
        setTenantItem('dapodik_npsn', npsn);
        if (directUrl) {
          setTenantItem('school_logo_url', directUrl);
        } else {
          removeTenantItem('school_logo_url');
        }
        window.dispatchEvent(new Event('dapodik_settings_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      // 2. Persist to Server Database
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const res = await fetch('/api/v1/schools/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: namaSekolah,
            npsn: npsn,
            logo_url: directUrl || null,
            dapodik_url: dapodikUrl || null,
            dapodik_token: dapodikToken || null
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.data?.logo_url) {
            setLogoUrl(json.data.logo_url);
            setTenantItem('school_logo_url', json.data.logo_url);
          }
          setStatusMessage('✓ Berhasil Tersimpan di Server!');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Gagal menyimpan pengaturan sekolah:', err);
    } finally {
      setSaving(false);
    }
  };

  const previewImageSrc = getDirectImageUrl(logoUrl);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <h1 className={styles.title} style={{ margin: 0 }}>Pengaturan Identitas &amp; Instansi Sekolah</h1>
            {statusMessage && (
              <span className="badge badge-success" style={{ fontSize: '0.68rem', fontWeight: 700 }}>{statusMessage}</span>
            )}
          </div>
          <p className={styles.subtitle}>Kelola integrasi aplikasi Dapodik, profil instansi sekolah, dan logo resmi sekolah Anda.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
        </button>
      </div>

      {/* Toast Notification */}
      {saved && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--success)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--success)',
          fontWeight: 700,
          fontSize: '0.85rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <span style={{ fontSize: '1.25rem' }}>✅</span>
          <div>
            <strong>Berhasil Tersimpan!</strong>
            <div style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '1px' }}>
              Nama instansi, Dapodik, dan logo resmi sekolah berhasil diperbarui secara real-time.
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Main Settings Card */}
      <div className={styles.card}>
        {/* SECTION 1 (PALING ATAS): INTEGRASI DAPODIK */}
        <div>
          <h3 className={styles.sectionTitle}>🌉 Integrasi Aplikasi Dapodik (Kemendikdasmen)</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Hubungkan aplikasi School OS dengan server aplikasi Dapodik lokal di sekolah Anda.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alamat Server Dapodik (Localhost)</label>
              <input type="text" value={dapodikUrl} onChange={(e) => setDapodikUrl(e.target.value)} className="input" style={{ marginTop: '0.25rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Token Akses Dapodik (Bearer Token)</label>
              <input type="text" value={dapodikToken} onChange={(e) => setDapodikToken(e.target.value)} placeholder="Masukkan Token WebService Dapodik..." className="input" style={{ marginTop: '0.25rem' }} />
            </div>
          </div>
        </div>

        {/* SECTION 2 (TENGAH): PROFIL INSTANSI SEKOLAH */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
          <h3 className={styles.sectionTitle}>🏫 Profil Instansi Sekolah</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Identitas resmi sekolah yang otomatis tampil pada Sidebar, Header Topbar, e-Rapor, dan dokumen kelulusan.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Sekolah / Instansi</label>
              <input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} placeholder="Masukkan nama sekolah..." className="input" style={{ marginTop: '0.25rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NPSN Sekolah (Kemendikdasmen)</label>
              <input type="text" value={npsn} onChange={(e) => setNpsn(e.target.value)} placeholder="Masukkan NPSN sekolah..." className="input" style={{ marginTop: '0.25rem' }} />
            </div>
          </div>
        </div>

        {/* SECTION 3 (DIBAWAH SETTING NAMA SEKOLAH): PENGATURAN LOGO DINAMIS */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className={styles.sectionTitle}>🖼️ Pengaturan Logo Resmi Sekolah</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Logo ini otomatis ditampilkan pada Sidebar, Header, Cetak Rapor, dan Aplikasi Android Mobile.
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Otomatis Sinkron Real-Time</span>
          </div>

          {/* Preset Buttons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem', marginTop: '1rem' }}>
            {LOGO_PRESETS.map((preset) => {
              const isSelected = logoUrl === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    setLogoUrl(preset.url);
                  }}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>{preset.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{preset.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>{preset.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload File + Custom URL + Live Preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px',
            gap: '1.25rem',
            marginTop: '1.25rem',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📁 Unggah File Logo dari Perangkat (Rekomendasi)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📂 Pilih File Gambar (PNG / JPG / SVG)
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setLogoUrl('')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      ✕ Reset ke Default
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Atau Tempelkan Link / URL Gambar Logo Online:
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Tempelkan tautan gambar logo (misal: https://.../logo.png)..."
                  className="input"
                  style={{ marginTop: '0.35rem' }}
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              minHeight: '100px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>PRATINJAU LOGO</span>
              {previewImageSrc ? (
                <img
                  src={previewImageSrc}
                  alt="Pratinjau Logo"
                  referrerPolicy="no-referrer"
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.4';
                  }}
                />
              ) : (
                <svg viewBox="0 0 64 64" fill="none" width="44" height="44">
                  <defs>
                    <linearGradient id="prevLg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <rect width="64" height="64" rx="14" fill="url(#prevLg)" />
                  <path d="M32 14L46 22V32C46 42 39.5 48.5 32 51C24.5 48.5 18 42 18 32V22L32 14Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
                  <path d="M32 22L44 28L32 34L20 28L32 22Z" fill="white" />
                  <path d="M25 32V37C25 39.5 28 41.5 32 41.5C36 41.5 39 39.5 39 37V32" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
