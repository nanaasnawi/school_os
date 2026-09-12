'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, BookOpen, FileCheck, X } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'assignment' | 'lesson';
  timestamp: string;
  isRead: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: '1',
      title: 'Modul Lesson Dipublikasikan',
      message: 'Modul Fisika Kuantum Dasar telah dipublikasikan ke siswa.',
      type: 'lesson',
      timestamp: '10 menit yang lalu',
      isRead: false,
    },
    {
      id: '2',
      title: 'Tugas Baru Dibuat',
      message: 'PR Hukum Newton #1 berhasil dibuat (Batas: 12 Agt 2026).',
      type: 'assignment',
      timestamp: '1 jam yang lalu',
      isRead: false,
    },
    {
      id: '3',
      title: 'Submission Masuk',
      message: 'Ahmad mengunggah Attempt #2 untuk PR Hukum Newton #1.',
      type: 'info',
      timestamp: '2 jam yang lalu',
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'assignment':
        return <FileCheck className="w-4 h-4 text-sky-400" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Notification Center</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">Tidak ada notifikasi</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors flex items-start gap-3 ${
                    n.isRead ? 'bg-slate-900/40' : 'bg-slate-800/40'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
