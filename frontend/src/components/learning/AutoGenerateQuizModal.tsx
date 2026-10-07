'use client';

import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, Calendar, BookOpen, Layers, AlertCircle, Loader2 } from 'lucide-react';

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

      const res = await fetch('/api/v1/learning/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal membuat soal ujian otomatis.');
      }

      setGeneratedResult(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#F8FAFC',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Generate Kuis & Ujian CBT Otomatis
              </h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                Rangkum materi 1 bulan sebelumnya untuk ujian berkala atau buat kuis cepat per bab
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FCA5A5',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Subject Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
              Mata Pelajaran (Mapel) <span style={{ color: '#F59E0B', fontSize: '12px' }}>*Terkunci, soal 100% spesifik mapel</span>
            </label>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setGeneratedResult(null);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#F8FAFC',
                fontSize: '14px',
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

          {/* 2. Scope: Monthly 1-month summary vs Single module */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
              Cakupan Pembuatan Soal
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => {
                  setExamScope('MONTHLY_SUMMARY');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `2px solid ${examScope === 'MONTHLY_SUMMARY' ? '#F59E0B' : '#334155'}`,
                  backgroundColor: examScope === 'MONTHLY_SUMMARY' ? 'rgba(245, 158, 11, 0.12)' : '#1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Calendar size={18} color={examScope === 'MONTHLY_SUMMARY' ? '#FBBF24' : '#94A3B8'} />
                  <strong style={{ fontSize: '14px', color: examScope === 'MONTHLY_SUMMARY' ? '#FBBF24' : '#E2E8F0' }}>
                    🗓️ Ujian Bulanan (Rangkuman 1 Bulan)
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                  Otomatis merangkum seluruh materi yang pernah di-publish selama 30 hari terakhir pada mapel ini untuk dijadikan soal ujian berkala komprehensif.
                </p>
              </div>

              <div
                onClick={() => {
                  setExamScope('SINGLE_MODULE');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `2px solid ${examScope === 'SINGLE_MODULE' ? '#3B82F6' : '#334155'}`,
                  backgroundColor: examScope === 'SINGLE_MODULE' ? 'rgba(59, 130, 246, 0.12)' : '#1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <BookOpen size={18} color={examScope === 'SINGLE_MODULE' ? '#38BDF8' : '#94A3B8'} />
                  <strong style={{ fontSize: '14px', color: examScope === 'SINGLE_MODULE' ? '#38BDF8' : '#E2E8F0' }}>
                    📖 Kuis Bab / Materi Terakhir
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                  Fokus membuat soal evaluasi harian dari materi pembelajaran yang baru saja di-publish pada mapel ini.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Question Format Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
              Format Butir Soal
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('MCQ_ONLY');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${quizFormat === 'MCQ_ONLY' ? '#F59E0B' : '#334155'}`,
                  backgroundColor: quizFormat === 'MCQ_ONLY' ? '#D97706' : '#1E293B',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Pilihan Ganda (PG) Saja
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizFormat('MCQ_AND_ESSAY');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${quizFormat === 'MCQ_AND_ESSAY' ? '#F59E0B' : '#334155'}`,
                  backgroundColor: quizFormat === 'MCQ_AND_ESSAY' ? '#D97706' : '#1E293B',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Pilihan Ganda (PG) & Essay
              </button>
            </div>
          </div>

          {/* Action Generate Button */}
          {!generatedResult && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  backgroundColor: '#F59E0B',
                  backgroundImage: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sedang Menghimpun & Merangkum Materi...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Soal Otomatis Sekarang
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div
              style={{
                marginTop: '20px',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#FBBF24',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  ✓ Berhasil Disusun Otomatis ({generatedResult.questions?.length || 0} Soal)
                </span>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Waktu: {generatedResult.time_limit_minutes} Menit • KKM: {generatedResult.passing_score}
                </span>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                {generatedResult.title}
              </h4>

              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px 0' }}>
                {generatedResult.description}
              </p>

              {generatedResult.source_materials?.length > 0 && (
                <div style={{ marginBottom: '16px', fontSize: '12px', color: '#CBD5E1' }}>
                  <strong>Materi Rujukan ({generatedResult.source_materials.length} Modul Terbit):</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {generatedResult.source_materials.slice(0, 4).map((m: any) => (
                      <li key={m.id}>
                        [{m.type?.toUpperCase()}] {m.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedResult.questions?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
                    Preview Butir Soal:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {generatedResult.questions.map((q: any, idx: number) => (
                      <div
                        key={q.id || idx}
                        style={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#FBBF24' }}>
                            Soal {idx + 1} ({q.question_type === 'MULTIPLE_CHOICE' ? 'PG' : 'Essay'})
                          </span>
                          <span style={{ color: '#38BDF8' }}>{q.points} Poin</span>
                        </div>
                        <div style={{ color: '#E2E8F0', marginBottom: '6px' }}>{q.question_text}</div>
                        {q.choices?.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
                            {q.choices.map((c: any, cIdx: number) => (
                              <div
                                key={cIdx}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: c.is_correct ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                  color: c.is_correct ? '#34D399' : '#94A3B8',
                                  border: c.is_correct ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                                }}
                              >
                                {String.fromCharCode(65 + cIdx)}. {c.choice_text.substring(0, 45)}...
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#334155',
                    color: '#E2E8F0',
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Generate Ulang
                </button>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: 800,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> Terapkan ke Formulir Kuis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
