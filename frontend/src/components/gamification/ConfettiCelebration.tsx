'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface XpRewardEventDetail {
  xpEarned: number;
  totalXp: number;
  level: number;
  actionType: 'READ_MATERIAL' | 'SUBMIT_ASSIGNMENT' | 'COMPLETE_QUIZ' | string;
  title?: string;
  description?: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  angleSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
}

const COLORS = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#8B5CF6', '#F43F5E', '#14B8A6'];

export function playCelebrationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.36);
    });
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function ConfettiCelebration() {
  const [reward, setReward] = useState<XpRewardEventDetail | null>(null);
  const [displayedTotalXp, setDisplayedTotalXp] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Listen to global schoolos:xp-earned event
  useEffect(() => {
    const handleXpEvent = (e: Event) => {
      const customEvent = e as CustomEvent<XpRewardEventDetail>;
      if (customEvent.detail) {
        setReward(customEvent.detail);
        playCelebrationSound();
      }
    };

    window.addEventListener('schoolos:xp-earned', handleXpEvent);
    return () => {
      window.removeEventListener('schoolos:xp-earned', handleXpEvent);
    };
  }, []);

  // Animated counter for Total XP
  useEffect(() => {
    if (!reward) return;

    const start = Math.max(0, reward.totalXp - reward.xpEarned);
    const target = reward.totalXp;
    setDisplayedTotalXp(start);

    const duration = 1200; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * ease);
      setDisplayedTotalXp(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(step);
    }, 400);

    return () => clearTimeout(timer);
  }, [reward]);

  // Canvas confetti animation
  useEffect(() => {
    if (!reward) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: ConfettiParticle[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.45 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 6,
        angle: Math.random() * 360,
        angleSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.6 ? 'circle' : 'rect',
        opacity: 1,
      });
    }

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.985; // air resistance
        p.angle += p.angleSpeed;

        if (frame > 60) {
          p.opacity -= 0.015;
        }

        if (p.opacity <= 0) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      const active = particles.some(p => p.opacity > 0 && p.y < canvas.height + 50);
      if (active) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reward]);

  if (!reward) return null;

  const getActionHeading = () => {
    switch (reward.actionType) {
      case 'READ_MATERIAL':
        return 'Materi Selesai Dipelajari! 📖';
      case 'SUBMIT_ASSIGNMENT':
        return 'Tugas Berhasil Dikumpulkan! 📝';
      case 'COMPLETE_QUIZ':
        return 'Ujian / Kuis Selesai! 🏆';
      default:
        return 'Luar Biasa! Pencapaian Baru ✨';
    }
  };

  const level = reward.level || Math.floor(Math.sqrt((reward.totalXp || 1) / 50)) + 1;
  const currentLevelBase = Math.pow(level - 1, 2) * 50;
  const nextLevelTarget = Math.pow(level, 2) * 50;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((displayedTotalXp - currentLevelBase) / (nextLevelTarget - currentLevelBase || 1)) * 100))
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 7, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '24px',
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.25)',
          color: '#F8FAFC',
        }}
      >
        {/* Glow Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
            marginBottom: '16px',
            fontSize: '36px',
          }}
        >
          ⭐
        </div>

        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            marginBottom: '6px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #60A5FA, #A78BFA, #F472B6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {getActionHeading()}
        </h3>

        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
          {reward.description || 'Kerja bagus! Penguasaan materi Anda terus bertambah.'}
        </p>

        {/* XP Point Awarded Callout */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>XP Diperoleh</div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#FBBF24',
                letterSpacing: '-0.02em',
              }}
            >
              +{reward.xpEarned} XP
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Total XP Sekarang</div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#38BDF8',
              }}
            >
              {displayedTotalXp.toLocaleString('id-ID')} XP
            </div>
          </div>
        </div>

        {/* Level & Progress */}
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0' }}>
              🎖️ Level {level}
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              {progressPercent}% ke Level {level + 1}
            </span>
          </div>

          {/* Progress bar container */}
          <div
            style={{
              height: '10px',
              backgroundColor: '#1E293B',
              borderRadius: '999px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)',
                borderRadius: '999px',
                transition: 'width 0.8s ease-out',
              }}
            />
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setReward(null)}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: '#3B82F6',
            backgroundImage: 'linear-gradient(135deg, #2563EB, #4F46E5)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '15px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.15s ease, filter 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
          }}
        >
          Keren, Lanjutkan Belajar! 🚀
        </button>
      </div>
    </div>
  );
}

/**
 * Helper function to trigger XP award & celebration popup
 */
export async function awardXpToStudent(params: {
  studentId: string;
  actionType: 'READ_MATERIAL' | 'SUBMIT_ASSIGNMENT' | 'COMPLETE_QUIZ';
  referenceId: string;
  description?: string;
  tenantId?: string;
}): Promise<void> {
  try {
    let res = await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: params.studentId,
        action_type: params.actionType,
        reference_id: params.referenceId,
        description: params.description,
        tenant_id: params.tenantId,
      }),
    });

    if (!res.ok && res.status === 404) {
      res = await fetch('/api/v1/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: params.studentId,
          action_type: params.actionType,
          reference_id: params.referenceId,
          description: params.description,
          tenant_id: params.tenantId,
        }),
      });
    }

    if (res.ok) {
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (json.success && json.awarded) {
        window.dispatchEvent(
          new CustomEvent('schoolos:xp-earned', {
            detail: {
              xpEarned: json.xp_earned,
              totalXp: json.total_xp,
              level: json.level,
              actionType: json.action_type,
              description: params.description,
            },
          })
        );
      }
    }
  } catch (err) {
    console.error('Failed to award XP:', err);
  }
}
