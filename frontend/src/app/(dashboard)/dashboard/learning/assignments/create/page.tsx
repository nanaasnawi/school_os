'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { listTeachers, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sparkles,
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Settings,
  ListOrdered,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { AutoGenerateAssignmentModal } from '@/components/learning/AutoGenerateAssignmentModal';

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes('guru') || user?.role?.toLowerCase().includes('teacher') || user?.role?.toLowerCase().includes('pengajar');

  // Master Data
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

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
          if (isTeacher && user?.full_name) {
            setTeacherName(user.full_name);
          } else if (list.length > 0) {
            setTeacherName(list[0].full_name);
          }
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
  }, [isTeacher, user?.full_name]);

  useEffect(() => {
    if (isTeacher && user?.full_name) {
      setTeacherName(user.full_name);
    }
  }, [isTeacher, user?.full_name]);

  // Check URL query parameters for auto-generation trigger from materials page
  useEffect(() => {
    const autoGen = searchParams.get('autoGenerate');
    const sourceSubject = searchParams.get('sourceSubject');
    if (sourceSubject) {
      setSubjectName(sourceSubject);
    }
    if (autoGen === 'true') {
      setIsAutoModalOpen(true);
    }
  }, [searchParams]);

  const handleApplyAutoGeneratedAssignment = (data: {
    title: string;
    instructions: string;
    assignmentFormat: 'STRUCTURED_QUESTIONS' | 'HOMEWORK_PR';
    questions: any[];
    subjectName: string;
  }) => {
    setTitle(data.title);
    setInstructions(data.instructions);
    setAssignmentFormat(data.assignmentFormat);
    if (data.subjectName) {
      setSubjectName(data.subjectName);
    }
    if (data.questions && data.questions.length > 0) {
      setQuestions(
        data.questions.map((q, idx) => ({
          id: `q-auto-${idx + 1}`,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points || 10,
          choices: (q.choices || []).map((c: any) => ({
            choice_text: c.choice_text || c.text || '',
            is_correct: !!c.is_correct || !!c.isCorrect,
          })),
        }))
      );
    }
    showToast('Berhasil menerapkan butir soal & instruksi otomatis ke formulir!', 'success');
  };

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
      showToast('Tugas terstruktur harus memiliki setidaknya satu butir soal', 'warning');
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
      showToast('Masukkan judul tugas pembelajaran', 'warning');
      return;
    }

    let payloadQuestions: Array<{ points?: number; [key: string]: unknown }> = [];
    if (assignmentFormat === 'STRUCTURED_QUESTIONS') {
      const validQuestions = questions.filter(q => q.question_text.trim().length > 0);
      if (validQuestions.length === 0) {
        showToast('Tuliskan minimal satu butir soal pada tugas terstruktur ini', 'warning');
        return;
      }

      // Validate choices
      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];
        if (q.question_type === 'MULTIPLE_CHOICE') {
          const filledChoices = q.choices.filter(c => c.choice_text.trim().length > 0);
          if (filledChoices.length < 2) {
            showToast(`Soal #${i + 1} harus memiliki minimal 2 pilihan jawaban yang terisi`, 'warning');
            return;
          }
          if (!q.choices.some(c => c.is_correct)) {
            showToast(`Tentukan kunci jawaban yang benar untuk soal #${i + 1}`, 'warning');
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
      const effectiveTeacherName = (isTeacher && user?.full_name) ? user.full_name : (teacherName || user?.full_name || 'Guru Pengampu');

      const targetClassObj = classesList.find(c => 
        c.name.toLowerCase().replace(/\s+/g, '') === (className || '').toLowerCase().replace(/\s+/g, '') || c.id === className
      );
      const targetSubjectObj = subjectsList.find(s => 
        s.name.toLowerCase() === (subjectName || '').toLowerCase() || s.id === subjectName
      );

      const payload = {
        title: title.trim(),
        description: `${subjectName || 'Umum'} • ${targetClassObj?.name || className || 'Semua Rombel'} • ${effectiveTeacherName} • ${instructions.slice(0, 100) || 'Tugas Pembelajaran Terstruktur'}`,
        instructions: instructions.trim() || undefined,
        max_score: computedMaxScore,
        due_at: `${dueDate}T${dueTime}:00Z`,
        assignment_type: assignmentFormat === 'HOMEWORK_PR' ? 'HOMEWORK' : 'QUIZ',
        class_id: targetClassObj?.id || className,
        subject_id: targetSubjectObj?.id || undefined,
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

      showToast('Tugas terstruktur berhasil diterbitkan & disinkronkan ke Android!', 'success');
      setTimeout(() => {
        router.push('/dashboard/learning/assignments');
      }, 800);
    } catch (err: unknown) {
      console.error('Error creating assignment:', err);
      const message = err instanceof Error ? err.message : 'Terjadi kendala saat menerbitkan tugas';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#ffffff',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
          fontWeight: 600,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Nav Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/learning" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Pembelajaran</Link>
            <span>/</span>
            <Link href="/dashboard/learning/assignments" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Tugas Siswa</Link>
            <span>/</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Buat Baru</span>
          </div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Buat Tugas Terstruktur Baru
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
              }}
            >
              {assignmentFormat === 'HOMEWORK_PR' ? 'Tugas Mandiri (PR)' : 'Tugas PG & Esai'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Susun butir soal terstruktur atau tugas mandiri yang langsung tersinkronisasi ke aplikasi mobile siswa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link
            href="/dashboard/learning/assignments"
            className="btn btn-secondary"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              padding: '7px 18px',
              fontWeight: 600,
              fontSize: '0.82rem',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              color: '#FFFFFF',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '13px',
                    height: '13px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span>Menerbitkan...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Terbitkan Tugas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Curriculum Generator Banner Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #76B900 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(118, 185, 0, 0.35)',
            }}
          >
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Pembuat Tugas Otomatis (AI NVIDIA)
              </span>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sintesis butir soal PG, esai &amp; rubrik secara instan dengan kecerdasan AI NVIDIA NIM dari modul materi pelajaran.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAutoModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '8px',
            background: 'rgba(118, 185, 0, 0.12)',
            color: '#76B900',
            fontWeight: 800,
            fontSize: '0.8rem',
            border: '1px solid rgba(118, 185, 0, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#76B900';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(118, 185, 0, 0.12)';
            e.currentTarget.style.color = '#76B900';
          }}
        >
          <Sparkles size={14} />
          <span>✨ Generate Tugas (AI NVIDIA)</span>
        </button>
      </div>

      {/* Format Selector Segmented Pill Bar */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setAssignmentFormat('STRUCTURED_QUESTIONS')}
          style={{
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            border: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '1px solid var(--border-medium)' : '1px solid transparent',
            background: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--bg-card)' : 'transparent',
            color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--shadow-xs)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <ListOrdered size={15} color={assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent)' : 'currentColor'} />
          <span>Soal Terstruktur (Pilihan Ganda & Esai)</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent-light)' : 'var(--bg-surface)',
              color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            App Android
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAssignmentFormat('HOMEWORK_PR')}
          style={{
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            border: assignmentFormat === 'HOMEWORK_PR' ? '1px solid var(--border-medium)' : '1px solid transparent',
            background: assignmentFormat === 'HOMEWORK_PR' ? 'var(--bg-card)' : 'transparent',
            color: assignmentFormat === 'HOMEWORK_PR' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: assignmentFormat === 'HOMEWORK_PR' ? 'var(--shadow-xs)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <UploadCloud size={15} color={assignmentFormat === 'HOMEWORK_PR' ? 'var(--accent)' : 'currentColor'} />
          <span>Tugas Mandiri / Unggah Lembar Kerja</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: assignmentFormat === 'HOMEWORK_PR' ? 'var(--accent-light)' : 'var(--bg-surface)',
              color: assignmentFormat === 'HOMEWORK_PR' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Unggah Berkas
          </span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Assignment Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={15} color="var(--text-secondary)" />
              <span>Informasi & Pengaturan Tugas</span>
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Judul Tugas <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Tugas Praktik Pengukuran Besaran Pokok"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
                style={{ height: '36px', fontSize: '0.82rem', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Mata Pelajaran <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                className="input"
                style={{ height: '36px', fontSize: '0.82rem' }}
              >
                {subjectsList.map(s => (
                  <option key={s.id || s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Rombel / Kelas <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Guru Pengampu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {isTeacher && user?.full_name ? (
                  <input
                    type="text"
                    disabled
                    value={user.full_name}
                    className="input"
                    style={{ width: '100%', height: '36px', fontSize: '0.82rem', background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                ) : (
                  <select
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    className="input"
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.full_name}>{t.full_name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Batas Tanggal (Due Date)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Pukul (WIB)
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="input"
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Petunjuk Pengerjaan / Instruksi Siswa <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan petunjuk pengerjaan yang jelas bagi siswa..."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="input"
                style={{ height: 'auto', padding: '0.55rem 0.7rem', fontSize: '0.82rem', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Real-time Summary Card (For Structured Questions) */}
          {assignmentFormat === 'STRUCTURED_QUESTIONS' && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--accent)" />
                <span>Ringkasan Soal & Penilaian</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Pilihan Ganda:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{multipleChoiceCount} Soal</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Essay / Uraian:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{essayCount} Soal</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', paddingTop: '0.45rem', borderTop: '1px dashed var(--border-light)' }}>
                <span style={{ fontWeight: 700 }}>Total Bobot Poin:</span>
                <span
                  style={{
                    color: 'var(--accent)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--accent-light)',
                  }}
                >
                  {totalPoints} Poin
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                Akumulasi bobot poin otomatis diskalakan ke rentang 0-100 pada lembar penilaian.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question Builder or Homework Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignmentFormat === 'STRUCTURED_QUESTIONS' ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FileText size={16} color="var(--accent)" />
                      <span>Butir Soal Tugas</span>
                    </h2>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                      }}
                    >
                      {questions.length} Butir
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Soal otomatis tersinkronisasi saat siswa membuka tugas di aplikasi mobile SchoolOS.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={13} />
                    <span>Soal PG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('ESSAY')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'rgba(147, 51, 234, 0.08)',
                      color: '#7e22ce',
                      border: '1px solid rgba(147, 51, 234, 0.25)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={13} />
                    <span>Soal Essay</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, qIdx) => {
                  const isMC = q.question_type === 'MULTIPLE_CHOICE';
                  return (
                    <div
                      key={q.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Question Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: isMC ? 'var(--accent)' : '#9333ea',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {qIdx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '5px',
                              background: isMC ? 'var(--accent-light)' : 'rgba(147, 51, 234, 0.1)',
                              color: isMC ? 'var(--accent)' : '#7e22ce',
                            }}
                          >
                            {isMC ? 'Pilihan Ganda (A-D)' : 'Uraian / Essay'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Bobot:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points}
                              onChange={e => updateQuestionPoints(qIdx, Math.max(1, parseInt(e.target.value) || 10))}
                              className="input"
                              style={{ width: '54px', height: '28px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', padding: '0 4px' }}
                            />
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Poin</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = '#fca5a5';
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.borderColor = 'var(--border-light)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Hapus Soal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Question Textarea */}
                      <div>
                        <textarea
                          rows={3}
                          placeholder={`Tuliskan teks pertanyaan butir #${qIdx + 1}...`}
                          value={q.question_text}
                          onChange={e => updateQuestionText(qIdx, e.target.value)}
                          className="input"
                          style={{ height: 'auto', padding: '0.6rem 0.75rem', fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.5, resize: 'vertical' }}
                        />
                      </div>

                      {/* Choices for Multiple Choice */}
                      {isMC && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            background: 'var(--bg-elevated)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.1rem' }}>
                            Pilihan Jawaban (Klik tombol huruf untuk menentukan Kunci Jawaban Benar):
                          </div>
                          {q.choices.map((choice, cIdx) => {
                            const optionLabel = String.fromCharCode(65 + cIdx);
                            return (
                              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: choice.is_correct ? '#10b981' : 'var(--bg-card)',
                                    color: choice.is_correct ? '#ffffff' : 'var(--text-secondary)',
                                    border: choice.is_correct ? '1.5px solid #059669' : '1px solid var(--border-medium)',
                                    fontWeight: 700,
                                    fontSize: '0.76rem',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Klik untuk jadikan kunci jawaban benar"
                                  onClick={() => setCorrectChoice(qIdx, cIdx)}
                                >
                                  {optionLabel}
                                </button>

                                <input
                                  type="text"
                                  placeholder={`Pilihan ${optionLabel}...`}
                                  value={choice.choice_text}
                                  onChange={e => updateChoiceText(qIdx, cIdx, e.target.value)}
                                  className="input"
                                  style={{
                                    height: '32px',
                                    fontSize: '0.8rem',
                                    borderColor: choice.is_correct ? '#10b981' : undefined,
                                    background: choice.is_correct ? 'rgba(16, 185, 129, 0.05)' : undefined,
                                  }}
                                />

                                {choice.is_correct && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: '#059669',
                                      flexShrink: 0,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                    }}
                                  >
                                    <Check size={12} />
                                    <span>Kunci Benar</span>
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

              {/* Bottom Question Actions */}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-light)' }}>
                <button
                  type="button"
                  onClick={() => addQuestion('MULTIPLE_CHOICE')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    padding: '6px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Soal Pilihan Ganda (A-D)</span>
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('ESSAY')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    padding: '6px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Soal Uraian / Essay</span>
                </button>
              </div>
            </div>
          ) : (
            /* Homework PR Mode Card */
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: 'var(--shadow-xs)',
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'var(--accent-light)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <UploadCloud size={24} />
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Tugas Mandiri / Unggah Lembar Kerja
                </h3>
                <p style={{ margin: '0.4rem auto 0 auto', maxWidth: '520px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Pada format ini, siswa tidak mengisi butir soal terstruktur di aplikasi, melainkan membaca petunjuk penugasan lalu mengunggah lembar kerja tugas (berkas PDF, foto bukti tugas, atau catatan jawaban).
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  width: '100%',
                  maxWidth: '600px',
                  marginTop: '0.5rem',
                }}
              >
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '3px' }}>LANGKAH 1</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Instruksi Jelas</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Isi petunjuk dan batas tanggal di kolom kiri.</div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '3px' }}>LANGKAH 2</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Siswa Mengunggah</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Siswa mengirimkan berkas lewat aplikasi Android.</div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '3px' }}>LANGKAH 3</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Koreksi & Nilai</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Guru menilai di menu Koreksi Massal / Buku Nilai.</div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  maxWidth: '600px',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: '0.25rem',
                }}
              >
                <AlertCircle size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Tips Pendidik:</strong> Pastikan kolom <em>Petunjuk Pengerjaan</em> di sebelah kiri terisi dengan instruksi lengkap serta format berkas yang diharapkan (PDF atau foto jelas).
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal Auto Generate Tugas */}
      <AutoGenerateAssignmentModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        subjects={subjectsList as any}
        selectedSubjectName={subjectName}
        onApply={handleApplyAutoGeneratedAssignment}
      />
    </div>
  );
}
