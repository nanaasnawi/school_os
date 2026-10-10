'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, getApiUrl } from '@/lib/api';

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Sync state if user loads later
  React.useEffect(() => {
    if (user?.full_name && !fullName) {
      setFullName(user.full_name);
    }
  }, [user?.full_name]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = apiClient.getToken();
      const res = await fetch(getApiUrl('/api/v1/auth/avatar'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const newAvatarUrl = json.data?.avatar_url;
        updateUser({ avatar_url: newAvatarUrl });
        await refreshUser();
        setProfileSuccessMsg('✅ Foto profil berhasil diunggah dan disimpan ke database!');
      } else {
        setProfileErrorMsg(json.error?.message || 'Gagal mengunggah foto profil.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      const token = apiClient.getToken();
      const res = await fetch(getApiUrl('/api/v1/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        updateUser({ full_name: fullName });
        setProfileSuccessMsg('✅ Informasi profil berhasil diperbarui.');
      } else {
        setProfileErrorMsg(json.error?.message || 'Gagal menyimpan profil.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = apiClient.getToken();
      const res = await fetch(getApiUrl('/api/v1/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordSuccessMsg('✅ Kata sandi berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordErrorMsg(json.error?.message || 'Gagal memperbarui kata sandi.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Resolve avatar URL
  const avatarDisplayUrl = user?.avatar_url
    ? user.avatar_url.startsWith('http')
      ? user.avatar_url
      : getApiUrl(user.avatar_url)
    : null;

  return (
    <div style={{ maxWidth: '1680px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '1rem 1.25rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', padding: '0.25rem 0', borderRadius: 0, border: 'none', boxShadow: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-dim)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>👤</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.25 }}>Profil Pengguna &amp; Keamanan Akun</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', fontWeight: 500, margin: '2px 0 0 0', lineHeight: 1.45 }}>Kelola foto pengguna, informasi identitas, dan kredensial autentikasi</p>
          </div>
        </div>
      </div>

      {profileSuccessMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
          {profileSuccessMsg}
        </div>
      )}
      {profileErrorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
          {profileErrorMsg}
        </div>
      )}

      {/* ── Profile Information & Avatar Upload ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Foto Profil Pengguna</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
          {/* Avatar Container with Hover/Action */}
          <div style={{ position: 'relative', width: '96px', height: '96px' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: avatarDisplayUrl ? '#0f172a' : '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 800,
                border: '3px solid var(--border-light)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              }}
            >
              {avatarDisplayUrl ? (
                <img
                  src={avatarDisplayUrl}
                  alt={user?.full_name || 'Foto Profil'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.email?.charAt(0).toUpperCase() ?? 'A'
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title="Unggah Foto Baru"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#2563eb',
                color: '#ffffff',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isUploadingPhoto ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {isUploadingPhoto ? '⏳' : '📷'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                style={{ fontWeight: 700 }}
              >
                {isUploadingPhoto ? 'Mengunggah...' : '📁 Pilih Foto Pengguna'}
              </button>
              {avatarDisplayUrl && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
                  onClick={async () => {
                    if (confirm('Hapus foto profil dan gunakan avatar inisial?')) {
                      setIsUploadingPhoto(true);
                      try {
                        const token = apiClient.getToken();
                        await fetch(getApiUrl('/api/v1/auth/profile'), {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ avatar_url: '' }),
                        });
                        updateUser({ avatar_url: undefined });
                        await refreshUser();
                        setProfileSuccessMsg('Foto profil telah dihapus.');
                      } catch (err: any) {
                        setProfileErrorMsg(err.message || 'Gagal menghapus foto.');
                      } finally {
                        setIsUploadingPhoto(false);
                      }
                    }
                  }}
                >
                  Hapus
                </button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Format yang didukung: JPG, PNG, atau WebP. Maksimal 5 MB. Foto langsung tersimpan persisten ke database.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Lengkap Pengguna</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso, M.Pd."
                className="input"
                style={{ marginTop: '0.4rem', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alamat Email (Login Utama)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input"
                style={{ marginTop: '0.4rem', width: '100%', opacity: 0.75, cursor: 'not-allowed', background: 'var(--bg-elevated)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Email dikunci oleh administrator mTLS sistem</span>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peran Akses (Role)</label>
              <div style={{ marginTop: '0.4rem' }}>
                <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
                  {user?.role || 'Administrator'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
              {isSavingProfile ? 'Menyimpan...' : '💾 Simpan Perubahan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password Card ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Ganti Kata Sandi</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Perbarui kata sandi akun Anda secara berkala demi keamanan</p>
        </div>

        {passwordSuccessMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
            {passwordSuccessMsg}
          </div>
        )}
        {passwordErrorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
            {passwordErrorMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kata Sandi Saat Ini *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama"
              className="input"
              style={{ marginTop: '0.3rem', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kata Sandi Baru *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="input"
              style={{ marginTop: '0.3rem', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Konfirmasi Kata Sandi Baru *</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="input"
              style={{ marginTop: '0.3rem', width: '100%' }}
            />
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-secondary" disabled={isChangingPassword}>
              {isChangingPassword ? 'Memperbarui...' : '🔒 Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
