'use client';

import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, BookOpen, Layers, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface AutoGenerateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: AcademicSubject[];
  selectedSubjectName: string;
  onApply: (data: {
    title: string;
    instructions: string;
    assignmentFormat: 'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR';
    questions: any[];
    subjectName: string;
  }) => void;
}

export function AutoGenerateAssignmentModal({
  isOpen,
  onClose,
  subjects,
  selectedSubjectName,
  onApply,
}: AutoGenerateAssignmentModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedSubjectName || (subjects[0]?.name || ''));
  const [sourceMode, setSourceMode] = useState<'LATEST' | 'HISTORY'>('LATEST');
  const [assignmentFormat, setAssignmentFormat] = useState<'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR'>('STRUCTURED_QUESTIONS');
  const [subjectMaterials, setSubjectMaterials] = useState<any[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

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

  // Load published materials when switching to HISTORY mode or changing subject
  useEffect(() => {
    if (!isOpen) return;

    const targetSubObj = subjects.find(s => s.name === selectedSubject);
    if (!targetSubObj) return;

    async function loadMaterials() {
      setIsLoadingMaterials(true);
      setErrorMsg(null);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const res = await fetch('/api/v1/learning/materials', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : [];
          // STRICT FILTER: Only materials matching current subject
          const filtered = list.filter((m: any) =>
            m.subject_id === targetSubObj?.id ||
            m.subject_name?.toLowerCase() === targetSubObj?.name.toLowerCase()
          );
          setSubjectMaterials(filtered);
          if (filtered.length > 0) {
            setSelectedMaterialId(filtered[0].id);
          } else {
            setSelectedMaterialId('');
          }
        }
      } catch (err) {
        console.error('Failed to load materials for subject:', err);
      } finally {
        setIsLoadingMaterials(false);
      }
    }

    loadMaterials();
  }, [isOpen, selectedSubject, subjects]);

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
      const type = assignmentFormat === 'HOMEWORK_PR' ? 'ASSIGNMENT_HOMEWORK' : 'ASSIGNMENT_STRUCTURED';
      const payload: any = {
        type,
        subject_id: currentSubjectObj.id,
        subject_name: currentSubjectObj.name,
      };

      if (sourceMode === 'HISTORY' && selectedMaterialId) {
        payload.source_mode = 'SELECTED_IDS';
        payload.material_ids = [selectedMaterialId];
      } else {
        payload.source_mode = 'LATEST_PUBLISHED';
      }

      const res = await fetch('/api/v1/learning/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal membuat tugas otomatis.');
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
      instructions: generatedResult.instructions,
      assignmentFormat: generatedResult.assignment_type,
      questions: generatedResult.questions || [],
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
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Generate Tugas Otomatis dari Materi Pembelajaran
              </h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                Otomatisasi pembuatan soal & tugas mandiri dengan garansi isolasi mata pelajaran
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
              Mata Pelajaran (Mapel) <span style={{ color: '#38BDF8', fontSize: '12px' }}>*Terkunci, tidak bocor antar mapel</span>
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

          {/* 2. Format Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
              Format Tugas yang Diinginkan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => {
                  setAssignmentFormat('STRUCTURED_QUESTIONS');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `2px solid ${assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#3B82F6' : '#334155'}`,
                  backgroundColor: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'rgba(59, 130, 246, 0.12)' : '#1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Layers size={18} color={assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#38BDF8' : '#94A3B8'} />
                  <strong style={{ fontSize: '14px', color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#38BDF8' : '#E2E8F0' }}>
                    Opsi A: PG & Essay
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                  Otomatis membuat 5 soal Pilihan Ganda (4 pilihan) dan 2 soal Essay analitis HOTS lengkap dengan rubrik.
                </p>
              </div>

              <div
                onClick={() => {
                  setAssignmentFormat('HOMEWORK_PR');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: `2px solid ${assignmentFormat === 'HOMEWORK_PR' ? '#10B981' : '#334155'}`,
                  backgroundColor: assignmentFormat === 'HOMEWORK_PR' ? 'rgba(16, 185, 129, 0.12)' : '#1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FileText size={18} color={assignmentFormat === 'HOMEWORK_PR' ? '#34D399' : '#94A3B8'} />
                  <strong style={{ fontSize: '14px', color: assignmentFormat === 'HOMEWORK_PR' ? '#34D399' : '#E2E8F0' }}>
                    Opsi B: Tugas Mandiri (PR)
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                  Otomatis menyusun instruksi tugas mandiri, petunjuk pengumpulan berkas/foto lembar kerja, dan rubrik penilaian.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Source Mode Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
              Sumber Materi Pembelajaran
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setSourceMode('LATEST');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${sourceMode === 'LATEST' ? '#3B82F6' : '#334155'}`,
                  backgroundColor: sourceMode === 'LATEST' ? '#2563EB' : '#1E293B',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Materi Baru / Terakhir Terbit
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceMode('HISTORY');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${sourceMode === 'HISTORY' ? '#3B82F6' : '#334155'}`,
                  backgroundColor: sourceMode === 'HISTORY' ? '#2563EB' : '#1E293B',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Pilih dari Materi Sebelumnya
              </button>
            </div>

            {sourceMode === 'HISTORY' && (
              <div>
                {isLoadingMaterials ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
                    <Loader2 size={16} className="animate-spin" /> Memuat materi mapel {selectedSubject}...
                  </div>
                ) : subjectMaterials.length === 0 ? (
                  <p style={{ color: '#F59E0B', fontSize: '13px', margin: 0 }}>
                    ⚠️ Belum ada materi yang terbit untuk mapel ini. Pilih 'Materi Baru / Terakhir Terbit'.
                  </p>
                ) : (
                  <select
                    value={selectedMaterialId}
                    onChange={e => {
                      setSelectedMaterialId(e.target.value);
                      setGeneratedResult(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '13px',
                    }}
                  >
                    {subjectMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.material_type?.toUpperCase() || 'MODUL'}] {m.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
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
                  backgroundColor: '#3B82F6',
                  backgroundImage: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sedang Menganalisis & Menyusun Soal...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Tugas Otomatis Sekarang
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
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  ✓ Berhasil Disusun Otomatis
                </span>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {generatedResult.assignment_type === 'HOMEWORK_PR' ? 'Tugas Mandiri (PR)' : `${generatedResult.questions?.length || 0} Soal (PG & Essay)`}
                </span>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px 0' }}>
                {generatedResult.title}
              </h4>

              <div
                style={{
                  fontSize: '13px',
                  color: '#CBD5E1',
                  backgroundColor: '#0F172A',
                  padding: '12px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #334155',
                  marginBottom: '16px',
                }}
              >
                {generatedResult.instructions}
              </div>

              {generatedResult.questions?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>
                    Daftar Soal yang Dihasilkan:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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
                          <span style={{ fontWeight: 700, color: '#38BDF8' }}>
                            Soal {idx + 1} ({q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'})
                          </span>
                          <span style={{ color: '#F59E0B' }}>{q.points} Poin</span>
                        </div>
                        <div style={{ color: '#E2E8F0' }}>{q.question_text}</div>
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
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> Terapkan ke Formulir Tugas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
