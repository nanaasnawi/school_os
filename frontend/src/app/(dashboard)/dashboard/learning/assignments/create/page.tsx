'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';

type QuestionChoice = {
  choice_text: string;
  is_correct: boolean;
};

type AssignmentQuestionForm = {
  id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  choices: QuestionChoice[];
};

interface TeacherItem {
  id: string;
  full_name: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id?: string;
  code?: string;
  name: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();

  // Master Data
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);

  // Assignment Format: STRUCTURED_QUESTIONS vs HOMEWORK_PR
  const [assignmentFormat, setAssignmentFormat] = useState<'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR'>('STRUCTURED_QUESTIONS');

  // Header Form Fields
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [dueDate, setDueDate] = useState<string>(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState<string>('23:59');
  const [instructions, setInstructions] = useState('');

  // Structured Questions State
  const [questions, setQuestions] = useState<AssignmentQuestionForm[]>([
    {
      id: 'q-1',
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      points: 20,
      choices: [
        { choice_text: '', is_correct: true },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ],
    },
    {
      id: 'q-2',
      question_text: '',
      question_type: 'ESSAY',
      points: 20,
      choices: [],
    },
  ]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadMasterData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, subjectRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } }).catch(() => null),
          listClasses({ query: { page_size: 100 } }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) setTeacherName(list[0].full_name);
        }
        if (classRes?.data?.data) {
          const list = classRes.data.data;
          setClassesList(list);
          if (list.length > 0) setClassName(list[0].name);
        }
        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) setSubjectName(subjectRes.data[0].name);
        }
      } catch (err) {
        console.error('Error loading master data for assignment create:', err);
      }
    }
    loadMasterData();
  }, []);

  // Questions Helper Methods
  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'ESSAY') => {
    const newId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    if (type === 'MULTIPLE_CHOICE') {
      setQuestions(prev => [
        ...prev,
        {
          id: newId,
          question_text: '',
          question_type: 'MULTIPLE_CHOICE',
          points: 20,
          choices: [
            { choice_text: '', is_correct: true },
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false },
          ],
        },
      ]);
    } else {
      setQuestions(prev => [
        ...prev,
        {
          id: newId,
          question_text: '',
          question_type: 'ESSAY',
          points: 20,
          choices: [],
        },
      ]);
    }
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      showToast('⚠️ Tugas terstruktur harus memiliki setidaknya satu butir soal', 'warning');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== qIndex));
  };

  const updateQuestionText = (qIndex: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, question_text: text } : q));
  };

  const updateQuestionPoints = (qIndex: number, pts: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, points: pts } : q));
  };

  const updateChoiceText = (qIndex: number, cIndex: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const choices = q.choices.map((c, ci) => ci === cIndex ? { ...c, choice_text: text } : c);
      return { ...q, choices };
    }));
  };

  const setCorrectChoice = (qIndex: number, cIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const choices = q.choices.map((c, ci) => ({ ...c, is_correct: ci === cIndex }));
      return { ...q, choices };
    }));
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const multipleChoiceCount = questions.filter(q => q.question_type === 'MULTIPLE_CHOICE').length;
  const essayCount = questions.filter(q => q.question_type === 'ESSAY').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('⚠️ Masukkan judul tugas pembelajaran', 'warning');
      return;
    }

    let payloadQuestions: Array<{ points?: number; [key: string]: unknown }> = [];
    if (assignmentFormat === 'STRUCTURED_QUESTIONS') {
      const validQuestions = questions.filter(q => q.question_text.trim().length > 0);
      if (validQuestions.length === 0) {
        showToast('⚠️ Tuliskan minimal satu butir soal pada tugas terstruktur ini', 'warning');
        return;
      }

      // Validate choices
      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];
        if (q.question_type === 'MULTIPLE_CHOICE') {
          const filledChoices = q.choices.filter(c => c.choice_text.trim().length > 0);
          if (filledChoices.length < 2) {
            showToast(`⚠️ Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban yang terisi`, 'warning');
            return;
          }
          if (!q.choices.some(c => c.is_correct)) {
            showToast(`⚠️ Tentukan kunci jawaban yang benar untuk soal #${i + 1}`, 'warning');
            return;
          }
        }
      }

      payloadQuestions = validQuestions.map((q, idx) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        points: Number(q.points) || 10,
        order_index: idx + 1,
        choices: q.question_type === 'MULTIPLE_CHOICE'
          ? q.choices
              .filter(c => c.choice_text.trim().length > 0)
              .map((c, cIdx) => ({
                choice_text: c.choice_text.trim(),
                is_correct: c.is_correct,
                order_index: cIdx + 1,
              }))
          : [],
      }));
    }

    setIsSubmitting(true);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;

    try {
      const totalQuestionsPoints = payloadQuestions.reduce((acc, q) => acc + (q.points || 0), 0);
      const computedMaxScore = totalQuestionsPoints > 0 ? totalQuestionsPoints : 100;

      const payload = {
        title: title.trim(),
        description: `${subjectName || 'Umum'} • ${className || 'Semua Rombel'} • ${teacherName || 'Guru Pengampu'} • ${instructions.slice(0, 100) || 'Tugas Pembelajaran Terstruktur'}`,
        instructions: instructions.trim() || undefined,
        max_score: computedMaxScore,
        due_at: `${dueDate}T${dueTime}:00Z`,
        assignment_type: assignmentFormat === 'HOMEWORK_PR' ? 'HOMEWORK' : 'QUIZ',
        class_id: className,
        questions: payloadQuestions.length > 0 ? payloadQuestions : undefined,
      };

      const res = await fetch(getApiUrl('/api/v1/learning/assignments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || 'Gagal membuat tugas');
      }

      showToast('✓ Tugas terstruktur berhasil diterbitkan & disinkronkan ke Android!', 'success');
      setTimeout(() => {
        router.push('/dashboard/learning/assignments');
      }, 800);
    } catch (err: unknown) {
      console.error('Error creating assignment:', err);
      const message = err instanceof Error ? err.message : '⚠️ Terjadi kendala saat menerbitkan tugas';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          fontWeight: 700,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header & Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/learning" style={{ color: 'var(--text-muted)' }}>Pembelajaran</Link>
          <span>/</span>
          <Link href="/dashboard/learning/assignments" style={{ color: 'var(--text-muted)' }}>Tugas Siswa</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Buat Tugas Baru</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href="/dashboard/learning/assignments"
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '10px', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>←</span> Kembali
              </Link>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Buat Tugas Terstruktur Baru
              </h1>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Susun tugas latihan atau tugas soal terstruktur (PG &amp; Essay) yang langsung tampil rapi di aplikasi mobile siswa.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Link href="/dashboard/learning/assignments" className="btn btn-secondary">
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Menerbitkan Tugas...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Terbitkan Tugas Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Format Selector Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '0.35rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.35rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <button
          type="button"
          onClick={() => setAssignmentFormat('STRUCTURED_QUESTIONS')}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent-gradient)' : 'transparent',
            color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s ease',
            boxShadow: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span>Soal Terstruktur (Pilihan Ganda &amp; Essay) — Ditampilkan di App Android</span>
        </button>

        <button
          type="button"
          onClick={() => setAssignmentFormat('HOMEWORK_PR')}
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: assignmentFormat === 'HOMEWORK_PR' ? 'var(--accent-gradient)' : 'transparent',
            color: assignmentFormat === 'HOMEWORK_PR' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s ease',
            boxShadow: assignmentFormat === 'HOMEWORK_PR' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>📁</span>
          <span>Tugas Mandiri / Unggah Berkas Lembar Kerja</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 1.8fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Assignment Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚙️</span>
              <span>Informasi &amp; Pengaturan Tugas</span>
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Judul Tugas *
              </label>
              <input
                type="text"
                placeholder="Contoh: Tugas Praktik Pengukuran Besaran Pokok"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
                style={{ fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Mata Pelajaran *
              </label>
              <select
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                className="input"
              >
                {subjectsList.map(s => (
                  <option key={s.id || s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Rombel / Kelas Target *
                </label>
                <select
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="input"
                >
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Guru Pengampu *
                </label>
                <select
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="input"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.full_name}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Batas Tanggal Pengumpulan (Due Date)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Pukul (WIB)
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Petunjuk Pengerjaan / Instruksi Siswa *
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan petunjuk pengerjaan tugas yang jelas untuk dibaca siswa..."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="input"
                style={{ height: 'auto', padding: '0.65rem 0.75rem', fontSize: '0.82rem', lineHeight: 1.5 }}
              />
            </div>
          </div>

          {/* Real-time Summary Card (For Structured Questions) */}
          {assignmentFormat === 'STRUCTURED_QUESTIONS' && (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                📊 Akumulasi Soal Tugas
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Pilihan Ganda:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{multipleChoiceCount} Soal</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Essay / Uraian:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{essayCount} Soal</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ fontWeight: 800 }}>Total Skor Maksimal:</span>
                <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>{totalPoints} Poin</strong>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question Builder or Homework Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {assignmentFormat === 'STRUCTURED_QUESTIONS' ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📝</span>
                    <span>Butir Soal Tugas ({questions.length} Soal)</span>
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Soal ini otomatis ditampilkan saat siswa membuka detail tugas di aplikasi Android SchoolOS.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', fontWeight: 800, borderColor: 'var(--accent)' }}
                  >
                    + Soal Pilihan Ganda
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('ESSAY')}
                    className="btn btn-secondary btn-sm"
                    style={{ background: '#f3e8ff', color: '#7e22ce', fontWeight: 800, borderColor: '#d8b4fe' }}
                  >
                    + Soal Essay
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {questions.map((q, qIdx) => {
                  const isMC = q.question_type === 'MULTIPLE_CHOICE';
                  return (
                    <div
                      key={q.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {/* Question Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isMC ? 'var(--accent)' : '#9333ea',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {qIdx + 1}
                          </span>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isMC ? 'var(--accent-light)' : '#f3e8ff',
                            color: isMC ? 'var(--accent-dark)' : '#7e22ce'
                          }}>
                            {isMC ? 'Pilihan Ganda (A-D)' : 'Uraian / Essay'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Bobot:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points}
                              onChange={e => updateQuestionPoints(qIdx, Math.max(1, parseInt(e.target.value) || 10))}
                              className="input"
                              style={{ width: '65px', height: '32px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}
                            />
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Poin</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '0.2rem 0.5rem' }}
                            title="Hapus Soal"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Question Textarea */}
                      <div>
                        <textarea
                          rows={3}
                          placeholder={`Tuliskan teks pertanyaan soal #${qIdx + 1}...`}
                          value={q.question_text}
                          onChange={e => updateQuestionText(qIdx, e.target.value)}
                          className="input"
                          style={{ height: 'auto', padding: '0.75rem', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}
                        />
                      </div>

                      {/* Choices for Multiple Choice */}
                      {isMC && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                            Pilihan Jawaban (Klik huruf untuk menentukan Kunci Jawaban Benar):
                          </div>
                          {q.choices.map((choice, cIdx) => {
                            const optionLabel = String.fromCharCode(65 + cIdx);
                            return (
                              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <label
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: choice.is_correct ? '#10b981' : 'var(--bg-card)',
                                    color: choice.is_correct ? '#ffffff' : 'var(--text-secondary)',
                                    border: choice.is_correct ? '2px solid #059669' : '1px solid var(--border-medium)',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  title="Klik untuk jadikan kunci jawaban benar"
                                  onClick={() => setCorrectChoice(qIdx, cIdx)}
                                >
                                  {optionLabel}
                                </label>

                                <input
                                  type="text"
                                  placeholder={`Isi teks pilihan ${optionLabel}...`}
                                  value={choice.choice_text}
                                  onChange={e => updateChoiceText(qIdx, cIdx, e.target.value)}
                                  className="input"
                                  style={{
                                    height: '36px',
                                    fontSize: '0.84rem',
                                    borderColor: choice.is_correct ? '#10b981' : undefined,
                                    background: choice.is_correct ? '#ecfdf5' : undefined
                                  }}
                                />

                                {choice.is_correct && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', flexShrink: 0 }}>
                                    ✓ Kunci Benar
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                <button
                  type="button"
                  onClick={() => addQuestion('MULTIPLE_CHOICE')}
                  className="btn btn-secondary"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  + Tambah Soal Pilihan Ganda (A-D)
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('ESSAY')}
                  className="btn btn-secondary"
                  style={{ fontWeight: 800, fontSize: '0.85rem' }}
                >
                  + Tambah Soal Uraian / Essay
                </button>
              </div>
            </div>
          ) : (
            /* Homework PR Mode Info Card */
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '3rem' }}>📂</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Tugas Mandiri / Proyek Siswa
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Pada format ini, siswa tidak mengisi lembar soal di aplikasi, melainkan membaca petunjuk pengerjaan yang kamu berikan lalu mengunggah lembar kerja tugas (berupa file PDF, foto bukti tugas, atau catatan jawaban).
              </p>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Tips:</strong> Pastikan kolom <em>Petunjuk Pengerjaan</em> di sebelah kiri terisi dengan instruksi yang lengkap dan detail agar siswa memahami kriteria penilaian tugas.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
