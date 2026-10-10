'use client';

import React, { useState, useEffect } from 'react';
import { AcademicSubject } from '@/features/material';
import { Sparkles, CheckCircle2, Layers, FileText, AlertCircle, Loader2, X, BookOpen } from 'lucide-react';
import { getApiUrl, apiClient } from '@/lib/api';

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

function cleanRobotText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\(AI\s+NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*\(NVIDIA\s+NIM\)/gi, '')
    .replace(/\s*oleh\s+AI\s+NVIDIA\s+NIM/gi, '')
    .replace(/\s*dari\s+AI\s+NVIDIA\s+NIM/gi, '')
    .trim();
}

export function AutoGenerateAssignmentModal({
  isOpen,
  onClose,
  subjects,
  selectedSubjectName,
  onApply,
}: AutoGenerateAssignmentModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedSubjectName || (subjects[0]?.name || ''));
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kelas 5 SD');
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'HOTS'>('Sedang');
  const [sourceMode, setSourceMode] = useState<'LATEST' | 'HISTORY'>('LATEST');
  const [assignmentFormat, setAssignmentFormat] = useState<'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR'>('STRUCTURED_QUESTIONS');
  
  // Customizable Question Counts & Visual Diagram options
  const [numMcq, setNumMcq] = useState<number>(4);
  const [numEssay, setNumEssay] = useState<number>(2);
  const [includeImages, setIncludeImages] = useState<boolean>(true);

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
        const token = apiClient.getToken() || (typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null);
        const res = await fetch('/api/v1/learning/materials', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const list = Array.isArray(json?.data) ? json.data : [];
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
      const effectiveTopic = topic.trim() || currentSubjectObj.name;
      const token = apiClient.getToken() || (typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null);

      const payload: any = {
        type,
        subject_id: currentSubjectObj.id,
        subject_name: currentSubjectObj.name,
        topic: effectiveTopic,
        grade_level: gradeLevel,
        difficulty,
        num_mcq: assignmentFormat === 'STRUCTURED_QUESTIONS' ? numMcq : 0,
        num_essay: assignmentFormat === 'STRUCTURED_QUESTIONS' ? numEssay : numEssay,
        include_images: includeImages,
        source_mode: sourceMode === 'HISTORY' && selectedMaterialId ? 'SELECTED_IDS' : 'LATEST_PUBLISHED',
        material_ids: sourceMode === 'HISTORY' && selectedMaterialId ? [selectedMaterialId] : [],
      };

      // Call Next.js proxy route with fallback resilience
      const endpoints = ['/api/learning/auto-generate', '/api/v1/learning/auto-generate'];
      let res: Response | null = null;
      let json: any = null;

      for (const endpoint of endpoints) {
        try {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          });
          json = await res.json().catch(() => null);
          if (res.ok && json?.success) {
            break;
          }
        } catch (fetchErr) {
          console.warn(`Attempt on ${endpoint} failed:`, fetchErr);
        }
      }

      // If both endpoints failed, retry once on the primary route after short delay
      if (!res?.ok || !json?.success) {
        await new Promise(r => setTimeout(r, 1200));
        for (const endpoint of endpoints) {
          try {
            res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(payload),
            });
            json = await res.json().catch(() => null);
            if (res.ok && json?.success) {
              break;
            }
          } catch {}
        }
      }

      if (!res?.ok || !json?.success) {
        const message = json?.error || (res?.status === 404 ? 'Layanan pembuatan tugas otomatis sedang tidak tersedia (404). Silakan hubungi admin atau coba lagi.' : `Gagal menghubungi server AI (${res?.status || 'network'}). Silakan coba kembali.`);
        throw new Error(message);
      }

      const data = json.data;
      if (data) {
        data.instructions = cleanRobotText(data.instructions);
        if (Array.isArray(data.questions)) {
          data.questions = data.questions.map((q: any) => ({
            ...q,
            question_text: cleanRobotText(q.question_text),
            explanation: cleanRobotText(q.explanation),
          }));
        }
      }

      setGeneratedResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kendala saat menyusun tugas otomatis dengan AI.');
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
      questions: (generatedResult.questions || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points || 20,
        image_url: q.image_url || undefined,
        choices: (q.choices || []).map((c: any) => ({
          choice_text: c.choice_text || c.text || '',
          is_correct: !!c.is_correct || !!c.isCorrect,
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
                  Generate Tugas Siswa Otomatis
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
                  AI Kurikulum Merdeka
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  margin: '3px 0 0 0',
                }}
              >
                Sintesis butir penugasan terstruktur &amp; tugas mandiri berbasis modul materi Kurikulum Merdeka
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
              Topik / Materi Penugasan Spesifik (Opsional)
            </label>
            <input
              type="text"
              placeholder={`Contoh: Laporan Praktikum Pengukuran Besaran (atau biarkan kosong untuk topik umum ${selectedSubject})`}
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

          {/* 3. Grade Level & Difficulty */}
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

          {/* 4. Format Selector */}
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
              Format Tugas yang Diinginkan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div
                onClick={() => {
                  setAssignmentFormat('STRUCTURED_QUESTIONS');
                  setGeneratedResult(null);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#76B900' : 'var(--border-light)'}`,
                  backgroundColor: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'rgba(118, 185, 0, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={17} color={assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#76B900' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.86rem', color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#76B900' : 'var(--text-primary)' }}>
                    Opsi A: Soal Terstruktur (PG &amp; Essay)
                  </strong>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Kombinasi soal pilihan ganda otomatis dan uraian analitis dengan rubrik penilaian lengkap.
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
                  border: `2px solid ${assignmentFormat === 'HOMEWORK_PR' ? '#76B900' : 'var(--border-light)'}`,
                  backgroundColor: assignmentFormat === 'HOMEWORK_PR' ? 'rgba(118, 185, 0, 0.08)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileText size={17} color={assignmentFormat === 'HOMEWORK_PR' ? '#76B900' : 'var(--text-muted)'} />
                  <strong style={{ fontSize: '0.86rem', color: assignmentFormat === 'HOMEWORK_PR' ? '#76B900' : 'var(--text-primary)' }}>
                    Opsi B: Tugas Mandiri / PR (Lembar Kerja)
                  </strong>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Instruksi tugas mandiri, petunjuk unggah foto lembar kerja, &amp; rubrik komprehensif.
                </p>
              </div>
            </div>

            {/* Sub-selector for Structured Questions: Num PG & Num Essay */}
            {assignmentFormat === 'STRUCTURED_QUESTIONS' ? (
              <div
                style={{
                  backgroundColor: 'rgba(118, 185, 0, 0.05)',
                  border: '1px solid rgba(118, 185, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Jumlah Soal Pilihan Ganda (PG)
                  </label>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[2, 4, 5, 10].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setNumMcq(cnt);
                          setGeneratedResult(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 2px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          border: `1px solid ${numMcq === cnt ? '#76B900' : 'var(--border-medium)'}`,
                          backgroundColor: numMcq === cnt ? '#76B900' : 'var(--bg-surface)',
                          color: numMcq === cnt ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {cnt} PG
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={numMcq}
                      onChange={e => {
                        setNumMcq(Math.max(1, parseInt(e.target.value) || 1));
                        setGeneratedResult(null);
                      }}
                      style={{
                        width: '46px',
                        padding: '5px 4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                      title="Jumlah Kustom PG"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                    Jumlah Soal Uraian / Essay
                  </label>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[1, 2, 3, 5].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setNumEssay(cnt);
                          setGeneratedResult(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 2px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          border: `1px solid ${numEssay === cnt ? '#9333ea' : 'var(--border-medium)'}`,
                          backgroundColor: numEssay === cnt ? '#9333ea' : 'var(--bg-surface)',
                          color: numEssay === cnt ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {cnt} Essay
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={numEssay}
                      onChange={e => {
                        setNumEssay(Math.max(1, parseInt(e.target.value) || 1));
                        setGeneratedResult(null);
                      }}
                      style={{
                        width: '46px',
                        padding: '5px 4px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                      title="Jumlah Kustom Essay"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(118, 185, 0, 0.05)',
                  border: '1px solid rgba(118, 185, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                }}
              >
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Jumlah Butir Lembar Kerja / Tugas Mandiri
                </label>
                <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
                  {[2, 3, 5].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setNumEssay(cnt);
                        setGeneratedResult(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: `1px solid ${numEssay === cnt ? '#76B900' : 'var(--border-medium)'}`,
                        backgroundColor: numEssay === cnt ? '#76B900' : 'var(--bg-surface)',
                        color: numEssay === cnt ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {cnt} Butir Tugas
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={numEssay}
                    onChange={e => {
                      setNumEssay(Math.max(1, parseInt(e.target.value) || 1));
                      setGeneratedResult(null);
                    }}
                    style={{
                      width: '60px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    title="Jumlah Kustom Tugas"
                  />
                </div>
              </div>
            )}

            {/* Visual Stimulus Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: includeImages ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                border: `1px solid ${includeImages ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-medium)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setIncludeImages(!includeImages);
                setGeneratedResult(null);
              }}
            >
              <input
                type="checkbox"
                id="includeImagesCheckbox"
                checked={includeImages}
                onChange={e => {
                  setIncludeImages(e.target.checked);
                  setGeneratedResult(null);
                }}
                style={{ cursor: 'pointer', accentColor: '#10B981', width: '16px', height: '16px' }}
              />
              <label
                htmlFor="includeImagesCheckbox"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                🎨 <strong>Sertakan Soal Bergambar / Diagram</strong> (Diagram sains, bagan alur, grafik, geometri, peta)
              </label>
            </div>
          </div>

          {/* 5. Source Mode Selector */}
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
              Sumber Referensi Pembelajaran
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
                  fontWeight: 700,
                  border: `1px solid ${sourceMode === 'LATEST' ? '#76B900' : 'var(--border-medium)'}`,
                  backgroundColor: sourceMode === 'LATEST' ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                  color: sourceMode === 'LATEST' ? '#76B900' : 'var(--text-secondary)',
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
                  fontWeight: 700,
                  border: `1px solid ${sourceMode === 'HISTORY' ? '#76B900' : 'var(--border-medium)'}`,
                  backgroundColor: sourceMode === 'HISTORY' ? 'rgba(118, 185, 0, 0.15)' : 'var(--bg-surface)',
                  color: sourceMode === 'HISTORY' ? '#76B900' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Pilih dari Modul / Materi Sebelumnya
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
                    <Loader2 size={18} className="animate-spin" /> Sedang Menganalisis &amp; Menyusun Tugas...
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
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(118, 185, 0, 0.15)',
                    color: '#76B900',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  Paket Tugas Terstruktur Berhasil Disusun
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {generatedResult.assignment_type === 'HOMEWORK_PR'
                    ? 'Tugas Mandiri (PR)'
                    : `${generatedResult.questions?.length || 0} Soal (${(generatedResult.questions || []).filter((q: any) => q.question_type === 'MULTIPLE_CHOICE').length} PG & ${(generatedResult.questions || []).filter((q: any) => q.question_type === 'ESSAY').length} Essay)`}
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
                          padding: '10px 12px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, color: q.question_type === 'MULTIPLE_CHOICE' ? '#76B900' : '#9333ea' }}>
                            Soal #{idx + 1} ({q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'})
                          </span>
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{q.points} Poin</span>
                        </div>
                        {q.image_url && (
                          <div style={{ margin: '6px 0', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', maxHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                            <img src={q.image_url} alt="Stimulus Visual" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }} />
                          </div>
                        )}
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{q.question_text}</div>
                        {q.question_type === 'MULTIPLE_CHOICE' && Array.isArray(q.choices) && q.choices.length > 0 && (
                          <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            {q.choices.map((c: any, cIdx: number) => {
                              const label = String.fromCharCode(65 + cIdx);
                              const isCorrect = !!c.is_correct || !!c.isCorrect;
                              return (
                                <div
                                  key={cIdx}
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.74rem',
                                    backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                                    color: isCorrect ? '#10B981' : 'var(--text-secondary)',
                                    fontWeight: isCorrect ? 700 : 400,
                                    border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`,
                                  }}
                                >
                                  <strong>{label}.</strong> {c.choice_text || c.text || ''} {isCorrect && '✓'}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
