'use client';

import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, Layers, FileText, AlertCircle, Loader2, X } from 'lucide-react';

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
          const json = await res.json().catch(() => null);
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
      setErrorMsg(err.message || 'Terjadi kendala saat menyusun soal otomatis.');
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
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px var(--accent-glow)',
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
                Generate Tugas Otomatis dari Materi
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                Otomatisasi pembuatan soal &amp; tugas mandiri terisolasi per mata pelajaran
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
              Mata Pelajaran (Mapel) <span style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>*Terkunci, tidak bocor antar mapel</span>
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

          {/* 2. Format Selector */}
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
              Format Tugas yang Diinginkan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                onClick={() => {
                  setAssignmentFormat('STRUCTURED_QUESTIONS');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent)' : 'var(--border-light)'}`,
                  backgroundColor: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={17} color={assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent)' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.88rem', color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent)' : 'var(--text-primary)' }}>
                    Opsi A: PG &amp; Essay
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  5 Soal Pilihan Ganda &amp; 2 Soal Essay analitis HOTS lengkap dengan rubrik.
                </p>
              </div>

              <div
                onClick={() => {
                  setAssignmentFormat('HOMEWORK_PR');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${assignmentFormat === 'HOMEWORK_PR' ? 'var(--success)' : 'var(--border-light)'}`,
                  backgroundColor: assignmentFormat === 'HOMEWORK_PR' ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileText size={17} color={assignmentFormat === 'HOMEWORK_PR' ? 'var(--success)' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.88rem', color: assignmentFormat === 'HOMEWORK_PR' ? 'var(--success)' : 'var(--text-primary)' }}>
                    Opsi B: Tugas Mandiri (PR)
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Instruksi tugas mandiri, panduan berkas/foto lembar kerja, &amp; rubrik.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Source Mode Selector */}
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
              Sumber Materi Pembelajaran
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSourceMode('LATEST');
                  setGeneratedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: `1px solid ${sourceMode === 'LATEST' ? 'var(--accent)' : 'var(--border-medium)'}`,
                  backgroundColor: sourceMode === 'LATEST' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: sourceMode === 'LATEST' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: `1px solid ${sourceMode === 'HISTORY' ? 'var(--accent)' : 'var(--border-medium)'}`,
                  backgroundColor: sourceMode === 'HISTORY' ? 'var(--accent)' : 'var(--bg-surface)',
                  color: sourceMode === 'HISTORY' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Pilih dari Materi Sebelumnya
              </button>
            </div>

            {sourceMode === 'HISTORY' && (
              <div>
                {isLoadingMaterials ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <Loader2 size={15} className="animate-spin" /> Memuat materi mapel {selectedSubject}...
                  </div>
                ) : subjectMaterials.length === 0 ? (
                  <p style={{ color: 'var(--warning)', fontSize: '0.82rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> Belum ada materi tersimpan untuk mapel ini. Sistem akan menyusun dari standar kompetensi kurikulum.
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
                      padding: '9px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                      outline: 'none',
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
            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  padding: '11px 26px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
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
                    <Loader2 size={17} className="animate-spin" /> Sedang Menganalisis &amp; Menyusun Tugas...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} /> Generate Tugas Otomatis Sekarang
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
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent)',
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
                  Berhasil Disusun Otomatis
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {generatedResult.assignment_type === 'HOMEWORK_PR' ? 'Tugas Mandiri (PR)' : `${generatedResult.questions?.length || 0} Soal (PG & Essay)`}
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
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-light)',
                  marginBottom: '14px',
                }}
              >
                {generatedResult.instructions}
              </div>

              {generatedResult.questions?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daftar Butir Soal yang Disusun:
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
                            Soal {idx + 1} ({q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'})
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
                  <CheckCircle2 size={15} /> Terapkan ke Formulir Tugas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
