import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, Calendar, BookOpen, Layers, AlertCircle, Loader2, X, Sliders } from 'lucide-react';
import { getApiUrl, apiClient } from '@/lib/api';

interface AutoGenerateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: AcademicSubject[];
  selectedSubjectName: string;
  onApply: (data: {
    title: string;
    description: string;
    durationMinutes: number;
    passingScore: number;
    questions: any[];
    subjectName: string;
  }) => void;
}

export function AutoGenerateQuizModal({
  isOpen,
  onClose,
  subjects,
  selectedSubjectName,
  onApply,
}: AutoGenerateQuizModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedSubjectName || (subjects[0]?.name || ''));
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kelas 5 SD');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'HOTS'>('Sedang');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [examScope, setExamScope] = useState<'MONTHLY_SUMMARY' | 'SINGLE_MODULE'>('MONTHLY_SUMMARY');
  const [quizFormat, setQuizFormat] = useState<'MCQ_ONLY' | 'MCQ_AND_ESSAY'>('MCQ_ONLY');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selected subject
  useEffect(() => {
    if (selectedSubjectName && subjects.some(s => s.name === selectedSubjectName)) {
      setSelectedSubject(selectedSubjectName);
    } else if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name);
    }
  }, [selectedSubjectName, subjects]);

  if (!isOpen) return null;

  const currentSubjectObj = subjects.find(s => s.name === selectedSubject);

  const handleGenerate = async () => {
    if (!currentSubjectObj) {
      setErrorMsg('Silakan pilih mata pelajaran terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedResult(null);

    try {
      const isMonthly = examScope === 'MONTHLY_SUMMARY';
      const effectiveTopic = topic.trim() || currentSubjectObj.name;
      const numQ = isMonthly ? 10 : numQuestions;
      const effectiveDiff = isMonthly ? 'HOTS' : difficulty;

      const token = apiClient.getToken() || (typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null);

      // Call Next.js proxy route which delegates strictly to NVIDIA NIM
      let res = await fetch('/api/v1/learning/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: isMonthly ? 'EXAM_MONTHLY' : (quizFormat === 'MCQ_ONLY' ? 'QUIZ_MCQ_ONLY' : 'QUIZ_MCQ_ESSAY'),
          format: quizFormat,
          subject_id: currentSubjectObj.id,
          subject_name: currentSubjectObj.name,
          topic: effectiveTopic,
          grade_level: gradeLevel,
          num_questions: numQ,
          difficulty: effectiveDiff,
          source_mode: isMonthly ? 'PAST_MONTH' : 'LATEST_PUBLISHED',
        }),
      });

      // If Next.js proxy fails, call backend NVIDIA NIM endpoint directly
      if (!res.ok) {
        const endpoint = getApiUrl('/api/v1/ai/generate-content');
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            mode: 'QUIZ',
            topic: effectiveTopic,
            subject_name: currentSubjectObj.name,
            grade_level: gradeLevel,
            num_questions: numQ,
            difficulty: effectiveDiff,
          }),
        });
      }

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const message = json?.error || (res.status === 404 ? 'Materi belum tersedia untuk mata pelajaran ini.' : `Gagal menghubungi server AI NVIDIA NIM (${res.status}).`);
        throw new Error(message);
      }

      const aiQuiz = json?.data?.quiz || json?.data;
      if (!aiQuiz || !aiQuiz.questions || aiQuiz.questions.length === 0) {
        throw new Error('Respons butir soal dari AI NVIDIA NIM kosong.');
      }

      const mappedQuestions = (aiQuiz.questions || []).map((q: any, idx: number) => {
        let choices = q.choices || [];
        const mappedChoices = choices.map((c: any) => ({
          text: typeof c === 'string' ? c : (c.choice_text || c.text || ''),
          isCorrect: typeof c === 'object' ? Boolean(c.is_correct || c.isCorrect) : false,
        }));

        if (q.correct_key && mappedChoices.length > 0) {
          const keyIdx = ['A', 'B', 'C', 'D', 'E'].indexOf(q.correct_key.toUpperCase());
          if (keyIdx >= 0 && keyIdx < mappedChoices.length) {
            mappedChoices.forEach((ch: any, i: number) => {
              ch.isCorrect = i === keyIdx;
            });
          }
        }

        return {
          id: q.id || `q-${idx + 1}-${Date.now()}`,
          question_text: q.question_text || q.text,
          question_type: q.question_type || 'MULTIPLE_CHOICE',
          points: q.points || Math.round(100 / Math.max(1, aiQuiz.questions.length)),
          choices: mappedChoices,
          explanation: q.explanation || 'Disusun oleh AI NVIDIA NIM',
        };
      });

      setGeneratedResult({
        title: aiQuiz.title || `Paket Soal CBT: ${effectiveTopic}`,
        description: aiQuiz.description || `Ujian CBT resmi disusun otomatis oleh AI NVIDIA NIM.`,
        time_limit_minutes: isMonthly ? 90 : 45,
        passing_score: 75,
        questions: mappedQuestions,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kendala saat menyusun soal kuis otomatis dengan AI NVIDIA NIM.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToForm = () => {
    if (!generatedResult) return;

    onApply({
      title: generatedResult.title,
      description: generatedResult.description,
      durationMinutes: generatedResult.time_limit_minutes || 60,
      passingScore: generatedResult.passing_score || 75,
      questions: (generatedResult.questions || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        choices: (q.choices || []).map((c: any) => ({
          text: c.text || c.choice_text || '',
          isCorrect: !!c.isCorrect || !!c.is_correct,
        })),
      })),
      subjectName: selectedSubject,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #76B900 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(118, 185, 0, 0.35)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Generate Kuis &amp; Ujian CBT (AI NVIDIA)
                </h2>
                <span
                  style={{
                    background: 'rgba(118, 185, 0, 0.15)',
                    color: '#76B900',
                    border: '1px solid rgba(118, 185, 0, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  NVIDIA NIM
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  margin: '3px 0 0 0',
                }}
              >
                Sintesis paket soal CBT &amp; kisi-kisi evaluasi otomatis menggunakan NVIDIA NIM Llama-3-70B
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--danger)',
                fontSize: '0.84rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Subject Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Mata Pelajaran (Mapel) <span style={{ color: '#76B900', fontSize: '0.78rem' }}>*Terkunci, isolasi penuh kurikulum</span>
            </label>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setGeneratedResult(null);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {subjects.map(s => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Custom Topic */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Topik / Materi Spesifik Soal (Opsional)
            </label>
            <input
              type="text"
              placeholder={`Contoh: Dinamika Gerak Lurus & Hukum Newton (atau biarkan kosong untuk materi umum ${selectedSubject})`}
              value={topic}
              onChange={e => {
                setTopic(e.target.value);
                setGeneratedResult(null);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* 3. Grade Level & Difficulty Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Jenjang / Tingkat Kelas
              </label>
              <select
                value={gradeLevel}
                onChange={e => {
                  setGradeLevel(e.target.value);
                  setGeneratedResult(null);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              >
                <option value="Kelas 1 SD">Kelas 1 SD</option>
                <option value="Kelas 2 SD">Kelas 2 SD</option>
                <option value="Kelas 3 SD">Kelas 3 SD</option>
                <option value="Kelas 4 SD">Kelas 4 SD</option>
                <option value="Kelas 5 SD">Kelas 5 SD</option>
                <option value="Kelas 6 SD">Kelas 6 SD</option>
                <option value="Kelas 7 SMP">Kelas 7 SMP</option>
                <option value="Kelas 8 SMP">Kelas 8 SMP</option>
                <option value="Kelas 9 SMP">Kelas 9 SMP</option>
                <option value="Kelas 10 SMA">Kelas 10 SMA</option>
                <option value="Kelas 11 SMA">Kelas 11 SMA</option>
                <option value="Kelas 12 SMA">Kelas 12 SMA</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Tingkat Kesulitan
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['Mudah', 'Sedang', 'HOTS'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDifficulty(d);
                      setGeneratedResult(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: `1px solid ${difficulty === d ? '#76B900' : 'var(--border-medium)'}`,
                      backgroundColor: difficulty === d ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                      color: difficulty === d ? '#76B900' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Question Count & Scope */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Jumlah Butir Soal
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[5, 10, 15].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setNumQuestions(cnt);
                      setGeneratedResult(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: `1px solid ${numQuestions === cnt ? '#76B900' : 'var(--border-medium)'}`,
                      backgroundColor: numQuestions === cnt ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                      color: numQuestions === cnt ? '#76B900' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cnt} Soal
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Komposisi Format
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setQuizFormat('MCQ_ONLY');
                    setGeneratedResult(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: `1px solid ${quizFormat === 'MCQ_ONLY' ? '#76B900' : 'var(--border-medium)'}`,
                    backgroundColor: quizFormat === 'MCQ_ONLY' ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                    color: quizFormat === 'MCQ_ONLY' ? '#76B900' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Pilihan Ganda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizFormat('MCQ_AND_ESSAY');
                    setGeneratedResult(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: `1px solid ${quizFormat === 'MCQ_AND_ESSAY' ? '#76B900' : 'var(--border-medium)'}`,
                    backgroundColor: quizFormat === 'MCQ_AND_ESSAY' ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                    color: quizFormat === 'MCQ_AND_ESSAY' ? '#76B900' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  PG + Essay
                </button>
              </div>
            </div>
          </div>

          {/* 5. Scope Selector: Bulanan vs 1 Materi */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Cakupan Evaluasi Ujian
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                onClick={() => {
                  setExamScope('MONTHLY_SUMMARY');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${examScope === 'MONTHLY_SUMMARY' ? '#76B900' : 'var(--border-light)'}`,
                  backgroundColor: examScope === 'MONTHLY_SUMMARY' ? 'rgba(118, 185, 0, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Calendar size={17} color={examScope === 'MONTHLY_SUMMARY' ? '#76B900' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.86rem', color: examScope === 'MONTHLY_SUMMARY' ? '#76B900' : 'var(--text-primary)' }}>
                    Ujian Bulanan (Rangkum 30 Hari)
                  </strong>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Merangkum seluruh capaian materi 1 bulan sebelumnya untuk paket soal komprehensif.
                </p>
              </div>

              <div
                onClick={() => {
                  setExamScope('SINGLE_MODULE');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${examScope === 'SINGLE_MODULE' ? '#76B900' : 'var(--border-light)'}`,
                  backgroundColor: examScope === 'SINGLE_MODULE' ? 'rgba(118, 185, 0, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <BookOpen size={17} color={examScope === 'SINGLE_MODULE' ? '#76B900' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.86rem', color: examScope === 'SINGLE_MODULE' ? '#76B900' : 'var(--text-primary)' }}>
                    Kuis Materi Terakhir / Topik Terpilih
                  </strong>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Menyusun kuis cepat berbasis topik spesifik atau materi terakhir yang baru diterbitkan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Generate Button */}
          {!generatedResult && (
            <div style={{ textAlign: 'center', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  padding: '11px 28px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #76B900 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(118, 185, 0, 0.4)',
                  opacity: isGenerating ? 0.8 : 1,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isGenerating) e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  if (!isGenerating) e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sedang Menganalisis &amp; Menyusun Ujian (NVIDIA NIM)...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Paket Ujian Sekarang (AI NVIDIA)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--warning)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  Paket Soal Berhasil Disusun
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Durasi {generatedResult.time_limit_minutes || 60} menit • KKM {generatedResult.passing_score || 75}
                </span>
              </div>

              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {generatedResult.title}
              </h4>

              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-light)',
                  marginBottom: '14px',
                }}
              >
                {generatedResult.description}
              </div>

              {generatedResult.questions?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daftar Butir Soal CBT ({generatedResult.questions.length} Soal):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {generatedResult.questions.map((q: any, idx: number) => (
                      <div
                        key={q.id || idx}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                            Soal #{idx + 1} ({q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'})
                          </span>
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{q.points} Poin</span>
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>{q.question_text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Generate Ulang
                </button>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={15} /> Terapkan ke Formulir Ujian CBT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
