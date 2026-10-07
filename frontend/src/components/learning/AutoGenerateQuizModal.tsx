'use client';

import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, Calendar, BookOpen, Layers, AlertCircle, Loader2, X } from 'lucide-react';

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
      const payload: any = {
        type: isMonthly ? 'EXAM_MONTHLY' : (quizFormat === 'MCQ_ONLY' ? 'QUIZ_MCQ_ONLY' : 'QUIZ_MCQ_ESSAY'),
        format: quizFormat,
        subject_id: currentSubjectObj.id,
        subject_name: currentSubjectObj.name,
        source_mode: isMonthly ? 'PAST_MONTH' : 'LATEST_PUBLISHED',
      };

      // Try /api/learning/auto-generate first, then fallback to /api/v1/learning/auto-generate
      let res = await fetch('/api/learning/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch('/api/v1/learning/auto-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const rawText = await res.text();
      let json: any = null;
      try {
        json = rawText ? JSON.parse(rawText) : null;
      } catch {
        // Not JSON
      }

      if (!res.ok || !json?.success) {
        const message = json?.error || (res.status === 404 ? 'Materi belum tersedia untuk mata pelajaran ini.' : `Gagal menghubungi server pembuatan otomatis (${res.status}).`);
        throw new Error(message);
      }

      setGeneratedResult(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kendala saat menyusun soal kuis otomatis.');
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
          text: c.choice_text,
          isCorrect: c.is_correct,
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Generate Kuis / Ujian CBT Otomatis
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                Otomatisasi pembuatan paket soal kuis atau ujian bulanan terisolasi per mata pelajaran
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
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Mata Pelajaran (Mapel) <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>*Terkunci, isolasi penuh</span>
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

          {/* 2. Scope Selector: Bulanan vs 1 Materi */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
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
                  border: `2px solid ${examScope === 'MONTHLY_SUMMARY' ? 'var(--warning)' : 'var(--border-light)'}`,
                  backgroundColor: examScope === 'MONTHLY_SUMMARY' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Calendar size={17} color={examScope === 'MONTHLY_SUMMARY' ? 'var(--warning)' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.88rem', color: examScope === 'MONTHLY_SUMMARY' ? 'var(--warning)' : 'var(--text-primary)' }}>
                    Ujian Bulanan (Rangkum 30 Hari)
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Merangkum seluruh materi 1 bulan sebelumnya untuk dijadikan paket soal komprehensif.
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
                  border: `2px solid ${examScope === 'SINGLE_MODULE' ? 'var(--accent)' : 'var(--border-light)'}`,
                  backgroundColor: examScope === 'SINGLE_MODULE' ? 'var(--accent-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <BookOpen size={17} color={examScope === 'SINGLE_MODULE' ? 'var(--accent)' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.88rem', color: examScope === 'SINGLE_MODULE' ? 'var(--accent)' : 'var(--text-primary)' }}>
                    Kuis Materi Terakhir
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Menyusun kuis cepat berbasis materi yang baru saja diterbitkan di kelas.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Format Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Komposisi Soal Ujian
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('MCQ_ONLY');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: `1px solid ${quizFormat === 'MCQ_ONLY' ? 'var(--accent)' : 'var(--border-medium)'}`,
                  backgroundColor: quizFormat === 'MCQ_ONLY' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: quizFormat === 'MCQ_ONLY' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Hanya Pilihan Ganda (PG)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('MCQ_AND_ESSAY');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: `1px solid ${quizFormat === 'MCQ_AND_ESSAY' ? 'var(--accent)' : 'var(--border-medium)'}`,
                  backgroundColor: quizFormat === 'MCQ_AND_ESSAY' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: quizFormat === 'MCQ_AND_ESSAY' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Kombinasi PG &amp; Essay Analitis
              </button>
            </div>
          </div>

          {/* Action Generate Button */}
          {!generatedResult && (
            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  padding: '11px 26px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-md)',
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
                    <Loader2 size={17} className="animate-spin" /> Sedang Menganalisis &amp; Menyusun Paket Ujian...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} /> Generate Paket Ujian Sekarang
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
                  }}
                >
                  ✓ Paket Soal Berhasil Disusun
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
