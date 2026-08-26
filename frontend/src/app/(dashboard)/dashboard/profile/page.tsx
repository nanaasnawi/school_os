'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '1.75rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1.25rem 1.75rem', borderRadius: '18px', border: '1px solid var(--border-light)', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-dim)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>👤</div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profil Pengguna &amp; Keamanan Akun</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 500 }}>Informasi Akun, Peran Akses, Kredensial mTLS, dan Pengaturan Kata Sandi</p>
          </div>
        </div>
        <button className="btn btn-primary">💾 Simpan Profil</button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '99px', background: '#2563eb', color: '#fff', fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.email?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.email ?? 'admin@schoolos.sch.id'}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
              <span className="badge badge-success" style={{ fontWeight: 800 }}>{user?.role ?? 'TENANT_ADMIN'}</span>
              <span className="badge badge-info" style={{ fontWeight: 800 }}>mTLS Authenticated</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Pengguna / Akun</label>
            <input type="text" defaultValue={user?.email ?? 'Administrator School OS'} className="input" style={{ marginTop: '0.3rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alamat Email</label>
            <input type="email" defaultValue={user?.email ?? 'admin@schoolos.sch.id'} className="input" style={{ marginTop: '0.3rem' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
