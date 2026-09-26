'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';

type QuestionChoice = {
  text: string;
  isCorrect: boolean;
};

type QuizQuestionForm = {
  id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  choices: QuestionChoice[];
};

export default function CreateQuizPage() {
  const router = useRouter();

  // Master Data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // Quiz Header Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [passingScore, setPassingScore] = useState<number>(75);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Questions Builder State
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([
    {
      id: 'q-1',
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      points: 20,
      choices: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
    {
      id: 'q-2',
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      points: 20,
      choices: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
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
      setIsLoadingMaster(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, subjectRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
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
          if (list.length > 0) setClassRoom(list[0].name);
        }
        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) setSubject(subjectRes.data[0].name);
        }
      } catch (err) {
        console.error('Error loading master data for quiz create:', err);
      } finally {
        setIsLoadingMaster(false);
      }
    }
    loadMasterData();
  }, []);

  // Helper Methods for Questions Builder
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
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
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
      showToast('⚠️ Kuis harus memiliki setidaknya satu butir soal', 'warning');
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
      const choices = q.choices.map((c, ci) => ci === cIndex ? { ...c, text } : c);
      return { ...q, choices };
    }));
  };

  const setCorrectChoice = (qIndex: number, cIndex: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const choices = q.choices.map((c, ci) => ({ ...c, isCorrect: ci === cIndex }));
      return { ...q, choices };
    }));
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const multipleChoiceCount = questions.filter(q => q.question_type === 'MULTIPLE_CHOICE').length;
  const essayCount = questions.filter(q => q.question_type === 'ESSAY').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('⚠️ Masukkan judul kuis atau ujian', 'warning');
      return;
    }

    // Validate questions
    const validQuestions = questions.filter(q => q.question_text.trim().length > 0);
    if (validQuestions.length === 0) {
      showToast('⚠️ Tuliskan minimal satu butir soal pada kuis ini', 'warning');
      return;
    }

    // Check choice validation
    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      if (q.question_type === 'MULTIPLE_CHOICE') {
        const filledChoices = q.choices.filter(c => c.text.trim().length > 0);
        if (filledChoices.length < 2) {
          showToast(`⚠️ Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban yang terisi`, 'warning');
          return;
        }
        if (!q.choices.some(c => c.isCorrect)) {
          showToast(`⚠️ Tentukan kunci jawaban yang benar untuk soal #${i + 1}`, 'warning');
          return;
        }
      }
    }

    setIsSubmitting(true);
    const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;

    try {
      // 1. Create Quiz Header
      const payload = {
        title: title.trim(),
        description: `${subject || 'Umum'} • ${classRoom || 'Semua Rombel'} • ${teacherName || 'Guru Pengampu'} • ${description || 'Kuis Online CBT'}`,
        duration_minutes: Number(durationMinutes) || 45,
        passing_score: Number(passingScore) || 75,
        class_id: classRoom,
      };

      const res = await fetch(getApiUrl('/api/v1/learning/quizzes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || 'Gagal membuat header kuis');
      }

      const resJson = await res.json();
      const quizId = resJson?.data?.id;

      if (!quizId) {
        throw new Error('ID kuis tidak ditemukan dari response server');
      }

      // 2. Add Questions sequentially
      for (let idx = 0; idx < validQuestions.length; idx++) {
        const q = validQuestions[idx];
        const questionPayload = {
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          points: Number(q.points) || 10,
          order_index: idx + 1,
          choices: q.question_type === 'MULTIPLE_CHOICE'
            ? q.choices
                .filter(c => c.text.trim().length > 0)
                .map((c, cIdx) => ({
                  choice_text: c.text.trim(),
                  is_correct: c.isCorrect,
                  order_index: cIdx + 1,
                }))
            : [],
        };

        await fetch(getApiUrl(`/api/v1/learning/quizzes/${quizId}/questions`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(questionPayload)
        });
      }

      // 3. Auto-publish the quiz
      await fetch(getApiUrl(`/api/v1/learning/quizzes/${quizId}/publish`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null);

      showToast('✓ Kuis & seluruh butir soal berhasil diterbitkan ke Android!', 'success');
      setTimeout(() => {
        router.push('/dashboard/learning/quizzes');
      }, 800);
    } catch (err: any) {
      console.error('Error creating quiz:', err);
      showToast(err?.message || '⚠️ Terjadi kesalahan saat menyimpan kuis', 'error');
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
          <Link href="/dashboard/learning/quizzes" style={{ color: 'var(--text-muted)' }}>Kuis CBT</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Buat Kuis Baru</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href="/dashboard/learning/quizzes"
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '10px', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>←</span> Kembali
              </Link>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Buat Kuis &amp; Ujian CBT Baru
              </h1>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Susun parameter evaluasi ujian CBT online beserta butir-butir soal pilihan ganda dan uraian secara leluasa.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Link href="/dashboard/learning/quizzes" className="btn btn-secondary">
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
                  <span>Menerbitkan Kuis...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Terbitkan Kuis Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 1.8fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Quiz Settings & Rules */}
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
              <span>Informasi &amp; Pengaturan Kuis</span>
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Judul Kuis / Ujian CBT *
              </label>
              <input
                type="text"
                placeholder="Contoh: Kuis 1 — Dinamika Gerak Lurus"
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
                value={subject}
                onChange={e => setSubject(e.target.value)}
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
                  value={classRoom}
                  onChange={e => setClassRoom(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Nilai KKM (Kelulusan)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={e => setPassingScore(Number(e.target.value) || 75)}
                  className="input"
                  style={{ fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Durasi Ujian (Menit)
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value) || 45)}
                  className="input"
                  style={{ fontWeight: 800 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Tanggal Pelaksanaan Ujian
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Petunjuk Pengerjaan untuk Siswa
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Kerjakan secara mandiri. Waktu akan berjalan otomatis saat tombol mulai ditekan."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input"
                style={{ height: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.8rem', lineHeight: 1.5 }}
              />
            </div>
          </div>

          {/* Real-time Summary Card */}
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
              📊 Ringkasan Akumulasi Soal
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Pilihan Ganda:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{multipleChoiceCount} Soal</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Uraian / Essay:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{essayCount} Soal</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
              <span style={{ fontWeight: 800 }}>Total Bobot Nilai:</span>
              <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>{totalPoints} Poin</strong>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Bank Builder (Spacious Full Page!) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  <span>Daftar Butir Soal Kuis ({questions.length} Butir)</span>
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tambahkan pertanyaan pilihan ganda dengan kunci jawaban otomatis atau soal essay.
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
                    {/* Question Header Bar */}
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

                    {/* Question Text */}
                    <div>
                      <textarea
                        rows={3}
                        placeholder={`Tuliskan pertanyaan soal #${qIdx + 1}...`}
                        value={q.question_text}
                        onChange={e => updateQuestionText(qIdx, e.target.value)}
                        className="input"
                        style={{ height: 'auto', padding: '0.75rem', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Choices (Multiple Choice) */}
                    {isMC && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                          Pilihan Jawaban &amp; Kunci Benar (Klik lingkaran untuk memilih kunci jawaban benar):
                        </div>
                        {q.choices.map((choice, cIdx) => {
                          const optionLabel = String.fromCharCode(65 + cIdx); // A, B, C, D
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
                                  background: choice.isCorrect ? '#10b981' : 'var(--bg-card)',
                                  color: choice.isCorrect ? '#ffffff' : 'var(--text-secondary)',
                                  border: choice.isCorrect ? '2px solid #059669' : '1px solid var(--border-medium)',
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
                                placeholder={`Isi pilihan ${optionLabel}...`}
                                value={choice.text}
                                onChange={e => updateChoiceText(qIdx, cIdx, e.target.value)}
                                className="input"
                                style={{
                                  height: '36px',
                                  fontSize: '0.84rem',
                                  borderColor: choice.isCorrect ? '#10b981' : undefined,
                                  background: choice.isCorrect ? '#ecfdf5' : undefined
                                }}
                              />

                              {choice.isCorrect && (
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

            {/* Bottom Add Buttons */}
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
        </div>

      </div>
    </div>
  );
}
