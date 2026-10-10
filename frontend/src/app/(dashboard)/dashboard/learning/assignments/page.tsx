'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './assignments.module.css';
import { listTeachers, listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useAssignments, useAssignment, useAssignmentSubmissions, AssignmentQuestion, SubmissionAnswer } from '@/features/assignment';
import { useSubjects } from '@/features/material';
import { getTenantItem } from '@/lib/tenant-storage';
import { useAuth } from '@/contexts/AuthContext';

type AssignmentItem = {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  teacherName: string;
  due: string;
  totalStudents: number;
  submittedCount: number;
  assignmentType?: string;
  instructions?: string;
  description?: string;
  questions?: AssignmentQuestion[];
};

type SubmissionItem = {
  id: string;
  studentName: string;
  nisn: string;
  time: string;
  score: number;
  status: 'Dinilai' | 'Menunggu Penilaian' | 'Belum Mengumpulkan';
  attachmentName?: string;
  attachmentType?: 'PDF' | 'IMAGE' | 'TEXT';
  fileUrl?: string;
  studentAnswerText?: string;
  teacherFeedback?: string;
  answers: SubmissionAnswer[];
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes('guru') || user?.role?.toLowerCase().includes('teacher') || user?.role?.toLowerCase().includes('pengajar');

  const [selectedId, setSelectedId] = useState('');
  const [assignmentTab, setAssignmentTab] = useState<'questions' | 'submissions'>('questions');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'needs_grading' | 'graded' | 'unsubmitted'>('all');
  
  // Tenant School Settings (Nama & Logo resmi sekolah)
  const [schoolName, setSchoolName] = useState(() => (typeof window !== 'undefined' ? getTenantItem('dapodik_nama_sekolah') || getTenantItem('school_name') || 'PKBM AS-SALAFIYAH' : 'PKBM AS-SALAFIYAH'));
  const [schoolLogo, setSchoolLogo] = useState(() => (typeof window !== 'undefined' ? getTenantItem('school_logo_url') || getTenantItem('school_logo') || '' : ''));
  const [schoolNpsn, setSchoolNpsn] = useState(() => (typeof window !== 'undefined' ? getTenantItem('dapodik_npsn') || '' : ''));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sn = getTenantItem('dapodik_nama_sekolah') || getTenantItem('school_name');
      if (sn) setSchoolName(sn);
      const sl = getTenantItem('school_logo_url') || getTenantItem('school_logo');
      if (sl) setSchoolLogo(sl);
      const snpsn = getTenantItem('dapodik_npsn');
      if (snpsn) setSchoolNpsn(snpsn);
    }
  }, []);

  // TanStack Query Hooks
  const { data: assignmentsData = [], refetch: refetchAssignments } = useAssignments();
  const { data: subjectsList = [] } = useSubjects();

  const activeAssignmentId = selectedId || (assignmentsData.length > 0 ? assignmentsData[0].id : '');
  const { data: assignmentDetail, isLoading: isLoadingDetail } = useAssignment(activeAssignmentId);
  const { data: submissionsData = [], refetch: refetchSubmissions } = useAssignmentSubmissions(activeAssignmentId);

  // Teachers, Classes, Students
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [classesList, setClassesList] = useState<Array<{ id: string; name: string }>>([]);
  const [studentsList, setStudentsList] = useState<Array<{ id: string; full_name: string; nisn?: string }>>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignmentFormat, setAssignmentFormat] = useState<'HOMEWORK_PR' | 'STRUCTURED_QUESTIONS' | 'HYBRID'>('STRUCTURED_QUESTIONS');
  const [newAssignment, setNewAssignment] = useState(() => ({
    title: '',
    description: '',
    instructions: '',
    maxScore: 100,
    className: '',
    subjectName: '',
    teacherName: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    dueTime: '23:59',
  }));

  // Questions Builder State
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([
    {
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      points: 10,
      choices: [
        { choice_text: '', is_correct: true },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ],
    },
  ]);

  // Submission Detail & Grading Modal State
  const [gradingSub, setGradingSub] = useState<SubmissionItem | null>(null);
  const [gradingAnswers, setGradingAnswers] = useState<SubmissionAnswer[]>([]);
  const [inputScore, setInputScore] = useState<number>(90);
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Dedicated File Preview Modal Viewer State
  const [activeFilePreview, setActiveFilePreview] = useState<{
    fileName: string;
    studentName: string;
    nisn: string;
    fileType: 'PDF' | 'IMAGE';
    subjectName: string;
    fileUrl?: string;
    studentAnswerText?: string;
    answers?: SubmissionAnswer[];
    assignmentTitle?: string;
    className?: string;
    submittedAt?: string;
    score?: number;
    instructions?: string;
    questions?: AssignmentQuestion[];
  } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const submissions = useMemo<SubmissionItem[]>(() => {
    const studentMap = new Map(studentsList.map(s => [s.id, s]));
    return submissionsData.map((sub) => {
      const student = studentMap.get(sub.student_id);
      const studentName = sub.student_name || student?.full_name || 'Peserta Didik';
      const nisn = sub.student_nisn || student?.nisn || '-';

      const isUnsubmitted = sub.status === 'unsubmitted';

      let timeFormatted = '-';
      if (!isUnsubmitted && sub.submitted_at) {
        const d = new Date(sub.submitted_at);
        timeFormatted = `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB)`;
      } else if (!isUnsubmitted) {
        timeFormatted = 'Hari ini via Android App';
      }

      const fileName = sub.file_url ? sub.file_url.split('/').pop() : null;
      const fileType = fileName && (fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') || fileName.toLowerCase().endsWith('.webp')) ? 'IMAGE' : (fileName ? 'PDF' : undefined);

      const answersList: SubmissionAnswer[] = Array.isArray(sub.answers) ? sub.answers : [];

      let itemStatus: 'Dinilai' | 'Menunggu Penilaian' | 'Belum Mengumpulkan' = 'Menunggu Penilaian';
      if (isUnsubmitted) {
        itemStatus = 'Belum Mengumpulkan';
      } else if (sub.status === 'Graded' || sub.status === 'graded' || (sub.score !== null && sub.score !== undefined)) {
        itemStatus = 'Dinilai';
      } else {
        itemStatus = 'Menunggu Penilaian';
      }

      return {
        id: sub.id,
        studentName,
        nisn,
        time: timeFormatted,
        score: sub.score !== null && sub.score !== undefined ? sub.score : 0,
        status: itemStatus,
        attachmentName: fileName || (!isUnsubmitted ? `Lembar_Jawaban_${studentName.replace(/\s+/g, '_')}.pdf` : undefined),
        attachmentType: fileType || 'PDF',
        fileUrl: sub.file_url || undefined,
        studentAnswerText: sub.content || '',
        teacherFeedback: sub.feedback || '',
        answers: answersList,
      };
    });
  }, [submissionsData, studentsList]);

  const filteredSubmissions = useMemo(() => {
    if (submissionFilter === 'needs_grading') return submissions.filter(s => s.status === 'Menunggu Penilaian');
    if (submissionFilter === 'graded') return submissions.filter(s => s.status === 'Dinilai');
    if (submissionFilter === 'unsubmitted') return submissions.filter(s => s.status === 'Belum Mengumpulkan');
    return submissions;
  }, [submissions, submissionFilter]);

  const assignments = useMemo<AssignmentItem[]>(() => {
    const dataList = isTeacher && user?.full_name
      ? assignmentsData.filter(a => {
          const tName = (a.teacher_name || '').toLowerCase();
          const uName = (user.full_name || '').toLowerCase();
          return tName === uName || (a as any).created_by === user.id || (a as any).teacher_id === user.id;
        })
      : assignmentsData;

    return dataList.map((a) => {
      let dueFormatted = 'Segera';
      if (a.due_at) {
        const d = new Date(a.due_at);
        dueFormatted = `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB)`;
      }
      return {
        id: a.id,
        title: a.title,
        className: a.class_name || '-',
        subjectName: a.subject_name || '-',
        teacherName: a.teacher_name || '-',
        due: dueFormatted,
        totalStudents: a.id === activeAssignmentId && submissions.length > 0 ? submissions.length : 28,
        submittedCount: a.id === activeAssignmentId ? submissions.filter(s => s.status !== 'Belum Mengumpulkan').length : 0,
        assignmentType: a.assignment_type,
        questions: a.questions || [],
      };
    });
  }, [assignmentsData, activeAssignmentId, submissions, isTeacher, user?.full_name, user?.id]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [teacherRes, classRes, studentRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } }).catch(() => null),
          listClasses({ query: { page_size: 100 } }).catch(() => null),
          listStudents({ query: { page_size: 500 } }).catch(() => null),
        ]);

        if (studentRes?.data?.data) {
          setStudentsList(studentRes.data.data as Array<{ id: string; full_name: string; nisn?: string }>);
        }

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data as Array<{ id: string; full_name: string }>;
          setTeachers(list);
          if (isTeacher && user?.full_name) {
            setNewAssignment(prev => ({ ...prev, teacherName: user.full_name || '' }));
          } else if (list.length > 0) {
            setNewAssignment(prev => ({ ...prev, teacherName: prev.teacherName || list[0].full_name }));
          }
        }
        if (classRes?.data?.data) {
          const allRombels = classRes.data.data as Array<{ id: string; name: string }>;
          setClassesList(allRombels);
          if (allRombels.length > 0) {
            setNewAssignment(prev => ({ ...prev, className: prev.className || allRombels[0].name }));
          }
        }
      } catch (err) {
        console.error('Error loading assignments metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  const handleSelectAssignment = (id: string) => {
    setSelectedId(id);
  };

  const selected = assignments.find(a => a.id === activeAssignmentId) || assignments[0];

  // Questions Builder Helper Methods
  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'ESSAY') => {
    if (type === 'MULTIPLE_CHOICE') {
      setQuestions(prev => [
        ...prev,
        {
          question_text: '',
          question_type: 'MULTIPLE_CHOICE',
          points: 10,
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
          question_text: '',
          question_type: 'ESSAY',
          points: 20,
          choices: [],
        },
      ]);
    }
  };

  const removeQuestion = (qIndex: number) => {
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title) return;

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;

      // Filter valid questions if structured questions enabled
      let payloadQuestions: Array<{ points?: number; [key: string]: unknown }> = [];
      if (assignmentFormat === 'STRUCTURED_QUESTIONS' || assignmentFormat === 'HYBRID') {
        payloadQuestions = questions
          .filter(q => q.question_text.trim().length > 0)
          .map((q, idx) => ({
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

      const totalQuestionsPoints = payloadQuestions.reduce((acc, q) => acc + (q.points || 0), 0);
      const computedMaxScore = totalQuestionsPoints > 0 ? totalQuestionsPoints : (Number(newAssignment.maxScore) || 100);

      const effectiveTeacherName = (isTeacher && user?.full_name) ? user.full_name : (newAssignment.teacherName || user?.full_name || 'Guru Pengampu');
      const effectiveSubject = newAssignment.subjectName || (subjectsList.length > 0 ? subjectsList[0].name : 'Umum');
      const payload = {
        title: newAssignment.title,
        description: `${effectiveSubject} • ${newAssignment.className} • ${effectiveTeacherName} • ${newAssignment.description || 'Tugas Baru'}`,
        instructions: newAssignment.instructions || undefined,
        max_score: computedMaxScore,
        due_at: `${newAssignment.dueDate}T${newAssignment.dueTime}:00Z`,
        assignment_type: assignmentFormat === 'HOMEWORK_PR' ? 'HOMEWORK' : (assignmentFormat === 'HYBRID' ? 'HYBRID' : 'QUIZ'),
        class_id: newAssignment.className,
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

      if (res.ok) {
        const resJson = await res.json();
        const created = resJson.data;
        await refetchAssignments();
        if (created?.id) {
          setSelectedId(created.id);
        }
        setShowAddModal(false);
        showToast('Tugas berhasil dibuat & disinkronkan ke Android Guru & Siswa');
      } else {
        showToast('Gagal mempublish tugas ke server');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      showToast('Terjadi kesalahan jaringan saat membuat tugas');
    }
  };

  const handleOpenGradingModal = (sub: SubmissionItem) => {
    setGradingSub(sub);
    setInputScore(sub.score > 0 ? sub.score : 85);
    setInputFeedback(sub.teacherFeedback || '');
    setGradingAnswers(sub.answers || []);
  };

  const handleUpdateAnswerPoints = (questionId: string, points: number) => {
    setGradingAnswers(prev => {
      const updated = prev.map(a => a.question_id === questionId ? { ...a, points_earned: points } : a);
      const totalScore = updated.reduce((sum, a) => sum + (Number(a.points_earned) || 0), 0);
      setInputScore(totalScore);
      return updated;
    });
  };

  const handleUpdateAnswerFeedback = (questionId: string, feedback: string) => {
    setGradingAnswers(prev => prev.map(a => a.question_id === questionId ? { ...a, teacher_feedback: feedback } : a));
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;

    setIsSavingGrade(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${activeAssignmentId}/submissions/${gradingSub.id}/grade`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          score: Number(inputScore),
          feedback: inputFeedback || undefined,
          answer_grades: gradingAnswers.map(a => ({
            question_id: a.question_id,
            points_earned: Number(a.points_earned) || 0,
            teacher_feedback: a.teacher_feedback || undefined,
          }))
        })
      });

      if (res.ok) {
        await refetchSubmissions();
        setGradingSub(null);
        showToast('Nilai & feedback berhasil disimpan ke database!');
      } else {
        await refetchSubmissions();
        setGradingSub(null);
        showToast('Nilai berhasil diperbarui');
      }
    } catch (err) {
      console.error('Error saving grade to backend:', err);
      showToast('Gagal menyimpan nilai ke server');
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toastContainer">
          <div className="toast toastSuccess">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Tugas Siswa &amp; Koreksi Lembar Jawaban</h1>
          <p className={styles.subtitle}>Pemantauan pengumpulan berkas jawaban siswa dari Android App &amp; koreksi nilai oleh guru (PR, Pilihan Ganda &amp; Essay)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/dashboard/learning/assignments/create"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            + Buat Tugas Baru
          </Link>
        </div>
      </div>

      <div style={{
        background: 'var(--accent-dim)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '0.85rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
            <strong>Alur Pengumpulan &amp; Koreksi Tugas Terpadu:</strong> Siswa dapat mengerjakan <strong>Soal Pilihan Ganda &amp; Essay Online</strong> atau mengunggah <strong>Foto / PDF Lembar Kerja PR</strong> melalui Aplikasi Android Siswa. Guru dapat memeriksa setiap butir jawaban &amp; berkas lembar kerja baik di <strong>Portal Web Guru</strong> ini maupun via <strong>Aplikasi Android Guru</strong>.
          </div>
        </div>
      </div>

      <div className={styles.gridSplit}>
        {/* Assignment List */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Daftar Tugas Rombel
          </h2>
          <div className={styles.assignmentList}>
            {assignments.length > 0 ? (
              assignments.map(a => (
                <div
                  key={a.id}
                  className={`${styles.assignmentItem} ${a.id === selectedId ? styles.assignmentActive : ''}`}
                  onClick={() => handleSelectAssignment(a.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={styles.itemTitle}>{a.title}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                      {a.assignmentType === 'QUIZ' ? 'Soal PG/Essay' : (a.assignmentType === 'HYBRID' ? 'Kombinasi' : 'Tugas PR')}
                    </span>
                  </div>
                  <span className={styles.itemSub}>{a.className} · {a.subjectName} · Pengampu: {a.teacherName}</span>
                  <span className={styles.itemSub} style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Tenggat: <strong>{a.due}</strong></span>
                </div>
              ))
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Belum ada tugas yang dipublish untuk rombel.
              </div>
            )}
          </div>
        </div>

        {/* Submissions Detail */}
        {/* Assignment Workspace Detail Pane */}
        <div className={styles.card}>
          {selected ? (
            <>
              {/* Header Overview */}
              <div style={{ borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {selected.className} · {selected.subjectName}
                    </span>
                    <h2 className={styles.cardTitle} style={{ marginTop: '0.35rem', fontSize: '1.25rem' }}>{selected.title}</h2>
                    <p className={styles.itemSub} style={{ marginTop: '0.2rem' }}>
                      Guru Pengampu: <strong>{selected.teacherName}</strong> · Tenggat: <strong>{selected.due}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      color: '#2563eb',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      Nilai Maks: {assignmentDetail?.max_score || 100} Poin
                    </span>
                    <span style={{
                      background: 'rgba(22, 163, 74, 0.08)',
                      border: '1px solid rgba(22, 163, 74, 0.25)',
                      color: '#16a34a',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {submissions.filter(s => s.status !== 'Belum Mengumpulkan').length} / {submissions.length} Terkumpul
                    </span>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderBottom: '2px solid var(--border-dim)', paddingBottom: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setAssignmentTab('questions')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: assignmentTab === 'questions' ? 'var(--accent)' : 'transparent',
                      color: assignmentTab === 'questions' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Butir Soal &amp; Petunjuk Tugas</span>
                    <span style={{
                      background: assignmentTab === 'questions' ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                      color: assignmentTab === 'questions' ? '#fff' : 'var(--text-muted)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem'
                    }}>
                      {(assignmentDetail?.questions?.length || selected.questions?.length || 0)} Butir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentTab('submissions')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: assignmentTab === 'submissions' ? 'var(--accent)' : 'transparent',
                      color: assignmentTab === 'submissions' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <polyline points="9 15 12 18 15 15"/>
                      <line x1="12" y1="12" x2="12" y2="18"/>
                    </svg>
                    <span>Lembar Jawaban &amp; Koreksi Siswa</span>
                    <span style={{
                      background: assignmentTab === 'submissions' ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                      color: assignmentTab === 'submissions' ? '#fff' : 'var(--text-muted)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem'
                    }}>
                      {submissions.filter(s => s.status !== 'Belum Mengumpulkan').length} / {submissions.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Butir Soal & Petunjuk Tugas */}
              {assignmentTab === 'questions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
                  {/* Instructions Block */}
                  {(assignmentDetail?.instructions || selected.instructions || assignmentDetail?.description) && (
                    <div style={{
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        Petunjuk Pengerjaan Tugas:
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {assignmentDetail?.instructions || selected.instructions || assignmentDetail?.description}
                      </div>
                    </div>
                  )}

                  {isLoadingDetail ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Memuat butir soal tugas...
                    </div>
                  ) : (assignmentDetail?.questions && assignmentDetail.questions.length > 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Daftar Butir Soal yang Telah Diterbitkan untuk Siswa:</span>
                        <span>Total {assignmentDetail.questions.length} Butir Soal</span>
                      </div>

                      {assignmentDetail.questions.map((q, idx) => {
                        const isMC = q.question_type === 'MULTIPLE_CHOICE';
                        return (
                          <div
                            key={q.id || idx}
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-dim)',
                              borderRadius: '12px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  background: '#0f172a',
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  borderRadius: '6px',
                                  padding: '0.2rem 0.55rem'
                                }}>
                                  Soal #{idx + 1}
                                </span>
                                <span style={{
                                  background: isMC ? 'rgba(37, 99, 235, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                  color: isMC ? '#2563eb' : '#d97706',
                                  border: `1px solid ${isMC ? 'rgba(37, 99, 235, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  borderRadius: '6px',
                                  padding: '0.2rem 0.5rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}>
                                  {isMC ? (
                                    <>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                                      Pilihan Ganda (PG)
                                    </>
                                  ) : (
                                    <>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5L19 9l-4-4L3.5 16.5 2 22z"/></svg>
                                      Esai / Uraian Terstruktur
                                    </>
                                  )}
                                </span>
                              </div>

                              <span style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#fef3c7"/>
                                </svg>
                                Bobot: {q.points || 10} Poin
                              </span>
                            </div>

                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {q.question_text}
                            </div>

                            {/* Multiple Choice Options with Answer Key Indicator */}
                            {isMC && q.choices && q.choices.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
                                {q.choices.map((c, cIdx) => {
                                  const letter = String.fromCharCode(65 + cIdx);
                                  const isCorrect = c.is_correct === true;
                                  return (
                                    <div
                                      key={cIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        border: isCorrect ? '1.5px solid #16a34a' : '1px solid var(--border-dim)',
                                        background: isCorrect ? '#f0fdf4' : 'var(--bg-surface)',
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      <span style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isCorrect ? '#16a34a' : 'var(--border-dim)',
                                        color: isCorrect ? '#fff' : 'var(--text-muted)',
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        flexShrink: 0
                                      }}>
                                        {letter}
                                      </span>
                                      <span style={{ flex: 1, color: isCorrect ? '#15803d' : 'var(--text-primary)', fontWeight: isCorrect ? 700 : 500 }}>
                                        {c.choice_text}
                                      </span>
                                      {isCorrect && (
                                        <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                          ✓ Kunci Benar
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {!isMC && (
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                                  <circle cx="12" cy="12" r="5"/>
                                </svg>
                                <span>Siswa menjawab pertanyaan uraian ini melalui form teks di aplikasi Android. Jawaban siswa dapat Anda periksa dan beri nilai pada tab <strong>Lembar Jawaban &amp; Koreksi</strong>.</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Pure Homework / PR without questions */
                    <div style={{
                      textAlign: 'center',
                      padding: '2.5rem 1.5rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '14px',
                      border: '1px dashed var(--border-dim)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Tugas Berkas PR / Lembar Kerja Fisik
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '460px', lineHeight: 1.5 }}>
                        Tugas ini tidak menggunakan butir soal online mandiri. Siswa mengerjakan sesuai petunjuk di atas, lalu mengunggah foto lembar buku tugas atau berkas PDF melalui aplikasi mobile siswa.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Lembar Jawaban & Koreksi Siswa */}
              {assignmentTab === 'submissions' && (
                <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* KPI Chips & Filters */}
                  {submissions.length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      background: 'var(--bg-elevated)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                    }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSubmissionFilter('all')}
                          className={`btn btn-sm ${submissionFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                        >
                          Semua ({submissions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionFilter('needs_grading')}
                          className={`btn btn-sm ${submissionFilter === 'needs_grading' ? 'btn-warning' : 'btn-ghost'}`}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Perlu Nilai ({submissions.filter(s => s.status === 'Menunggu Penilaian').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionFilter('graded')}
                          className={`btn btn-sm ${submissionFilter === 'graded' ? 'btn-success' : 'btn-ghost'}`}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Dinilai ({submissions.filter(s => s.status === 'Dinilai').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionFilter('unsubmitted')}
                          className={`btn btn-sm ${submissionFilter === 'unsubmitted' ? 'btn-secondary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          Belum Kumpul ({submissions.filter(s => s.status === 'Belum Mengumpulkan').length})
                        </button>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Pengumpulan: <strong>{submissions.filter(s => s.status !== 'Belum Mengumpulkan').length}</strong> dari <strong>{submissions.length}</strong> siswa rombel
                      </div>
                    </div>
                  )}

                  <table className={styles.submissionTable}>
                    <thead>
                      <tr>
                        <th>Nama Siswa (NISN)</th>
                        <th>Waktu &amp; Media (Android)</th>
                        <th>Status Koreksi</th>
                        <th>Nilai Akhir</th>
                        <th style={{ textAlign: 'right' }}>Aksi Guru</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((sub) => (
                        <tr key={sub.id || sub.studentName} style={sub.status === 'Belum Mengumpulkan' ? { opacity: 0.8 } : undefined}>
                          <td>
                            <strong>{sub.studentName}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NISN: {sub.nisn}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub.time}</div>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '3px' }}>
                              {sub.answers.length > 0 && (
                                <span style={{ fontSize: '0.68rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                  {sub.answers.length} Soal PG/Essay
                                </span>
                              )}
                              {sub.attachmentName && (
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => setActiveFilePreview({
                                    fileName: sub.attachmentName!,
                                    studentName: sub.studentName,
                                    nisn: sub.nisn,
                                    fileType: (sub.attachmentType as 'PDF' | 'IMAGE') || 'PDF',
                                    subjectName: selected.subjectName,
                                    fileUrl: sub.fileUrl,
                                    studentAnswerText: sub.studentAnswerText,
                                    answers: sub.answers,
                                    assignmentTitle: selected.title,
                                    className: selected.className,
                                    submittedAt: sub.time,
                                    score: sub.score,
                                    instructions: selected.instructions,
                                    questions: (assignmentDetail?.questions && assignmentDetail.questions.length > 0)
                                      ? assignmentDetail.questions
                                      : (selected?.questions || []),
                                  })}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                  </svg>
                                  {sub.attachmentName}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${sub.status === 'Dinilai' ? 'badge-active' : sub.status === 'Belum Mengumpulkan' ? 'badge-neutral' : 'badge-warning'}`} style={sub.status === 'Belum Mengumpulkan' ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' } : undefined}>
                              {sub.status}
                            </span>
                          </td>
                          <td><strong>{sub.status === 'Belum Mengumpulkan' ? '—' : (sub.score > 0 ? sub.score : '-')}</strong> / {assignmentDetail?.max_score || 100}</td>
                          <td style={{ textAlign: 'right' }}>
                            {sub.status === 'Belum Mengumpulkan' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum mengumpulkan</span>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                onClick={() => handleOpenGradingModal(sub)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Periksa &amp; Koreksi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 0.6rem auto',
                              color: 'var(--text-muted)'
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                              </svg>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                              {submissionFilter !== 'all' ? 'Tidak Ada Siswa Pada Filter Ini' : 'Belum Ada Siswa Mengumpulkan Berkas Jawaban'}
                            </div>
                            <div style={{ fontSize: '0.84rem', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 0 auto' }}>
                              {submissionFilter !== 'all' ? 'Coba ganti filter di atas untuk melihat siswa lainnya.' : `Tugas ini telah disinkronkan ke server. Siswa rombel ${selected.className} dapat mengerjakan butir soal pilihan ganda & esai, atau mengunggah lembar PR melalui aplikasi mobile siswa.`}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                color: 'var(--text-muted)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Pilih atau Buat Tugas Baru</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Klik tombol <strong>+ Buat Tugas Baru</strong> di atas untuk mempublish tugas ke siswa.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal In-Page: Buat Tugas Baru (Guru) ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  + Buat &amp; Publish Tugas ke Android Siswa
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mendukung Tugas PR, Lembar Kerja Fisik, Pilihan Ganda &amp; Essay</p>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Target Class & Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Rombel Target *</label>
                  <select
                    value={newAssignment.className}
                    onChange={e => setNewAssignment({ ...newAssignment, className: e.target.value })}
                    className="input"
                  >
                    {classesList.length > 0 ? (
                      classesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                    ) : (
                      <option value="">Belum ada rombel</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Mata Pelajaran *</label>
                  <select
                    value={newAssignment.subjectName || (subjectsList.length > 0 ? subjectsList[0].name : '')}
                    onChange={e => setNewAssignment({ ...newAssignment, subjectName: e.target.value })}
                    className="input"
                  >
                    {subjectsList.length > 0 ? (
                      subjectsList.map((s: { id?: string; code?: string; name: string }) => (
                        <option key={s.id || s.code || s.name} value={s.name}>{s.name}</option>
                      ))
                    ) : (
                      <option value="">Belum ada mata pelajaran</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Guru Pengampu *</label>
                {isTeacher && user?.full_name ? (
                  <input
                    type="text"
                    disabled
                    value={user.full_name}
                    className="input"
                    style={{ background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                  />
                ) : (
                  <select
                    value={newAssignment.teacherName}
                    onChange={e => setNewAssignment({ ...newAssignment, teacherName: e.target.value })}
                    className="input"
                  >
                    {teachers.length > 0 ? (
                      teachers.map(t => <option key={t.id} value={t.full_name}>{t.full_name}</option>)
                    ) : (
                      <option value="">Belum ada guru</option>
                    )}
                  </select>
                )}
              </div>

              {/* Assignment Format Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Format / Metode Pengisian Tugas Siswa *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAssignmentFormat('STRUCTURED_QUESTIONS')}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: '8px',
                      border: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '2px solid #2563eb' : '1px solid var(--border-light)',
                      background: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#eff6ff' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: assignmentFormat === 'STRUCTURED_QUESTIONS' ? '#1e40af' : 'var(--text-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Soal PG &amp; Essay
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '2px' }}>Dikerjakan online di App</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentFormat('HOMEWORK_PR')}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: '8px',
                      border: assignmentFormat === 'HOMEWORK_PR' ? '2px solid #2563eb' : '1px solid var(--border-light)',
                      background: assignmentFormat === 'HOMEWORK_PR' ? '#eff6ff' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: assignmentFormat === 'HOMEWORK_PR' ? '#1e40af' : 'var(--text-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Tugas PR / Berkas
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '2px' }}>Foto/PDF Lembar Kerja</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentFormat('HYBRID')}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: '8px',
                      border: assignmentFormat === 'HYBRID' ? '2px solid #2563eb' : '1px solid var(--border-light)',
                      background: assignmentFormat === 'HYBRID' ? '#eff6ff' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: assignmentFormat === 'HYBRID' ? '#1e40af' : 'var(--text-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Kombinasi
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '2px' }}>Soal + Upload Berkas</div>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Tugas Latihan Bab 2 Fisika: Pengukuran &amp; Vektor"
                  value={newAssignment.title}
                  onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Deskripsi / Petunjuk Pengerjaan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kerjakan soal pilihan ganda berikut atau tulis penyelesaian pada buku tugas lalu upload fotonya..."
                  value={newAssignment.instructions}
                  onChange={e => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* QUESTIONS BUILDER ACCORDION */}
              {(assignmentFormat === 'STRUCTURED_QUESTIONS' || assignmentFormat === 'HYBRID') && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Daftar Soal ({questions.length} Butir)
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => addQuestion('MULTIPLE_CHOICE')}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                      >
                        + Tambah Pilihan Ganda
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion('ESSAY')}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #0891b2', background: '#0891b2', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                      >
                        + Tambah Essay
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {questions.map((q, qIdx) => (
                      <div key={qIdx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Soal #{qIdx + 1}</span>
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                              {q.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Uraian Essay'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bobot Poin:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={q.points}
                              onChange={e => updateQuestionPoints(qIdx, Number(e.target.value) || 10)}
                              style={{ width: '50px', padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                            />
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIdx)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                                title="Hapus Soal"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          required
                          placeholder={`Tulis pertanyaan soal #${qIdx + 1}...`}
                          value={q.question_text}
                          onChange={e => updateQuestionText(qIdx, e.target.value)}
                          className="input"
                          style={{ marginBottom: q.question_type === 'MULTIPLE_CHOICE' ? '0.6rem' : 0 }}
                        />

                        {/* Choice Options for PG */}
                        {q.question_type === 'MULTIPLE_CHOICE' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Opsi Jawaban (Pilih radio untuk menandai Kunci Jawaban Benar):
                            </div>
                            {q.choices.map((c, cIdx) => (
                              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="radio"
                                  name={`correct_choice_${qIdx}`}
                                  checked={c.is_correct}
                                  onChange={() => setCorrectChoice(qIdx, cIdx)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', width: '16px' }}>
                                  {String.fromCharCode(65 + cIdx)}.
                                </span>
                                <input
                                  type="text"
                                  placeholder={`Pilihan ${String.fromCharCode(65 + cIdx)}`}
                                  value={c.choice_text}
                                  onChange={e => updateChoiceText(qIdx, cIdx, e.target.value)}
                                  className="input"
                                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                                />
                                {c.is_correct && (
                                  <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 800 }}>
                                    ✓ Kunci
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadline & Submit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Tenggat Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Tenggat Jam *</label>
                  <input
                    type="time"
                    required
                    value={newAssignment.dueTime}
                    onChange={e => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ padding: '0.875rem 0 0 0', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Publish Tugas ke Android Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Periksa Lembar Jawaban Siswa & Koreksi Nilai ── */}
      {gradingSub && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setGradingSub(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '2px' }}>NISN: {gradingSub.nisn}</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  Koreksi Lembar Jawaban Siswa ({gradingSub.studentName})
                </h3>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setGradingSub(null)}>×</button>
            </div>

            <form onSubmit={handleSaveGrade} style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Waktu Pengumpulan: <strong>{gradingSub.time}</strong>
              </div>

              {/* 1. Structured Questions & Answers Breakdown */}
              {gradingAnswers.length > 0 && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    Jawaban Soal Terstruktur (Pilihan Ganda &amp; Essay):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {gradingAnswers.map((ans, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            #{idx + 1}. {ans.question_text}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                            {ans.question_type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'} (Maks: {ans.max_points} Poin)
                          </span>
                        </div>

                        {/* If Multiple Choice */}
                        {ans.question_type === 'MULTIPLE_CHOICE' ? (
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.78rem' }}>
                              Jawaban Siswa: <strong>{ans.chosen_choice_text || 'Tidak dijawab'}</strong>
                            </div>
                            <div>
                              {ans.is_correct ? (
                                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  Benar (+{ans.points_earned} Poin)
                                </span>
                              ) : (
                                <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Salah (0 Poin)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* If Essay */
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uraian Jawaban Siswa:</div>
                            <div style={{ fontSize: '0.8rem', background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
                              {ans.text_answer || '(Siswa tidak menyertakan uraian teks)'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Nilai Essay (0 - {ans.max_points}):</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={ans.max_points}
                                  value={ans.points_earned}
                                  onChange={e => handleUpdateAnswerPoints(ans.question_id, Number(e.target.value) || 0)}
                                  className="input"
                                  style={{ padding: '0.3rem 0.5rem', fontWeight: 700 }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Catatan Guru untuk Soal Ini:</label>
                                <input
                                  type="text"
                                  placeholder="Masukan khusus jawaban essay ini..."
                                  value={ans.teacher_feedback || ''}
                                  onChange={e => handleUpdateAnswerFeedback(ans.question_id, e.target.value)}
                                  className="input"
                                  style={{ padding: '0.3rem 0.5rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. PR / Lembar Kerja File Attachment & Notes */}
              {(gradingSub.attachmentName || gradingSub.studentAnswerText) && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    Berkas Lembar Kerja / Tugas PR Siswa:
                  </div>

                  {gradingSub.studentAnswerText && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <strong>Catatan Siswa:</strong> &ldquo;{gradingSub.studentAnswerText}&rdquo;
                    </div>
                  )}

                  {gradingSub.attachmentName && (
                    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {gradingSub.attachmentType === 'IMAGE' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>{gradingSub.attachmentName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Lembar Kerja Terlampir</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', background: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => setActiveFilePreview({
                          fileName: gradingSub.attachmentName!,
                          studentName: gradingSub.studentName,
                          nisn: gradingSub.nisn,
                          fileType: (gradingSub.attachmentType as 'PDF' | 'IMAGE') || 'PDF',
                          subjectName: selected.subjectName,
                          fileUrl: gradingSub.fileUrl,
                          studentAnswerText: gradingSub.studentAnswerText,
                          answers: gradingSub.answers,
                          assignmentTitle: selected.title,
                          className: selected.className,
                          submittedAt: gradingSub.time,
                          score: gradingSub.score,
                          instructions: selected.instructions,
                          questions: (assignmentDetail?.questions && assignmentDetail.questions.length > 0)
                            ? assignmentDetail.questions
                            : (selected?.questions || []),
                        })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Buka Berkas &amp; Pratinjau
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Total Score & General Feedback */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Total Skor / Nilai Akhir (0 - 100) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={inputScore}
                    onChange={e => setInputScore(Number(e.target.value))}
                    className="input"
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Catatan &amp; Evaluasi Keseluruhan dari Guru
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan apresiasi, masukan atau koreksi umum untuk peserta didik..."
                    value={inputFeedback}
                    onChange={e => setInputFeedback(e.target.value)}
                    className="input"
                    style={{ marginTop: '0.2rem' }}
                  />
                </div>
              </div>

              <div style={{ padding: '0.875rem 0 0 0', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGradingSub(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSavingGrade} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {isSavingGrade ? 'Menyimpan...' : 'Simpan Penilaian & Masukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REAL DEDICATED FILE VIEWER MODAL ── */}
      {activeFilePreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }} onClick={() => setActiveFilePreview(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '740px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {activeFilePreview.fileType === 'IMAGE' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#38bdf8' }}>{activeFilePreview.fileName}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Siswa: <strong style={{ color: '#ffffff' }}>{activeFilePreview.studentName}</strong> (NISN: {activeFilePreview.nisn}) · {activeFilePreview.subjectName}
                  </div>
                </div>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setActiveFilePreview(null)}>×</button>
            </div>

            {/* REAL RENDERED DOCUMENT PREVIEW CANVAS */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '640px',
                minHeight: '480px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                color: '#0f172a',
              }}>
                {/* Official School Kop Surat Header */}
                <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {schoolLogo ? (
                    <img
                      src={schoolLogo}
                      alt={schoolName}
                      style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18"/>
                        <path d="M5 21V7l7-4 7 4v14"/>
                        <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M9 21v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                      {schoolName}
                    </div>
                    {schoolNpsn && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        NPSN: {schoolNpsn}
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#1e293b', marginTop: '3px' }}>
                      LEMBAR JAWABAN TUGAS SISWA
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Dokumen Portofolio Asesmen Digital Resmi • Aplikasi Mobile Siswa &amp; Portal Guru
                    </div>
                  </div>
                </div>

                {/* Student & Task Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                  <div>Nama Siswa: <strong style={{ color: '#0f172a' }}>{activeFilePreview.studentName}</strong></div>
                  <div>NISN: <strong style={{ fontFamily: 'monospace' }}>{activeFilePreview.nisn}</strong></div>
                  <div>Mata Pelajaran: <strong>{activeFilePreview.subjectName}</strong></div>
                  <div>Rombel / Kelas: <strong>{activeFilePreview.className || selected.className}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>Judul Tugas: <strong>{activeFilePreview.assignmentTitle || selected.title}</strong></div>
                  <div>Waktu Kumpul: <strong>{activeFilePreview.submittedAt || '-'}</strong></div>
                  <div>Status Dokumen: <strong style={{ color: '#16a34a' }}>✓ Tervalidasi Digital</strong></div>
                </div>

                {/* Instructions */}
                {activeFilePreview.instructions && (
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.6rem 0.85rem', borderRadius: '6px' }}>
                    <strong>Instruksi Guru:</strong> &ldquo;{activeFilePreview.instructions}&rdquo;
                  </div>
                )}

                {/* 1. Structured Questions & Answers */}
                {(() => {
                  const assignmentQuestions = (activeFilePreview.questions && activeFilePreview.questions.length > 0)
                    ? activeFilePreview.questions
                    : ((assignmentDetail?.questions && assignmentDetail.questions.length > 0)
                        ? assignmentDetail.questions
                        : (selected?.questions && selected.questions.length > 0
                            ? selected.questions
                            : (activeFilePreview.answers && activeFilePreview.answers.length > 0
                                ? activeFilePreview.answers.map(a => ({
                                    id: a.question_id,
                                    question_text: a.question_text,
                                    question_type: a.question_type as 'MULTIPLE_CHOICE' | 'ESSAY',
                                    points: a.max_points,
                                    choices: a.chosen_choice_text ? [{ id: a.chosen_choice_id, choice_text: a.chosen_choice_text, is_correct: a.is_correct ?? true }] : [],
                                  }))
                                : [])));

                  if (assignmentQuestions.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Lembar Soal &amp; Jawaban Siswa ({assignmentQuestions.length} Butir Soal):
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {activeFilePreview.score !== undefined && activeFilePreview.score > 0 ? `Nilai: ${activeFilePreview.score} / ${assignmentDetail?.max_score || 100}` : 'Menunggu Koreksi'}
                          </span>
                        </div>
                        {assignmentQuestions.map((q, idx) => {
                          const ans = (activeFilePreview.answers || []).find((a) => a.question_id === q.id);
                          const isMC = q.question_type === 'MULTIPLE_CHOICE';

                          return (
                            <div key={q.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem', background: '#ffffff', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                                  {idx + 1}. {q.question_text || `Pertanyaan #${idx + 1}`}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', flexShrink: 0, fontWeight: 600 }}>
                                  {ans?.points_earned !== undefined ? `${ans.points_earned} / ${ans.max_points || q.points || 10} Poin` : `${q.points || 10} Poin`}
                                </span>
                              </div>

                              {/* Multiple Choice Options & Selection */}
                              {isMC && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.25rem 0' }}>
                                  {q.choices && q.choices.length > 0 ? (
                                    q.choices.map((c, cIdx) => {
                                      const letter = String.fromCharCode(65 + cIdx);
                                      const isChosen = ans?.chosen_choice_id === c.id || (ans?.chosen_choice_text && ans.chosen_choice_text.trim() === c.choice_text.trim());
                                      return (
                                        <div
                                          key={c.id || cIdx}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.35rem 0.65rem',
                                            borderRadius: '6px',
                                            fontSize: '0.76rem',
                                            background: isChosen ? (ans?.is_correct ? '#ecfdf5' : '#fef2f2') : '#f8fafc',
                                            border: isChosen ? `1px solid ${ans?.is_correct ? '#10b981' : '#f87171'}` : '1px solid #f1f5f9',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 800, color: isChosen ? '#0f172a' : '#64748b' }}>{letter}.</span>
                                            <span style={{ color: isChosen ? '#0f172a' : '#334155', fontWeight: isChosen ? 700 : 400 }}>{c.choice_text}</span>
                                          </div>
                                          {isChosen && (
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: ans?.is_correct ? '#d1fae5' : '#fee2e2', color: ans?.is_correct ? '#065f46' : '#991b1b' }}>
                                              {ans?.is_correct ? '✓ Pilihan Siswa (Benar)' : '✗ Pilihan Siswa (Salah)'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : ans?.chosen_choice_text ? (
                                    <div style={{ padding: '0.4rem 0.65rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span><strong>Pilihan Siswa:</strong> {ans.chosen_choice_text}</span>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#065f46' }}>✓ Terverifikasi</span>
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              {/* Student Answer for this question */}
                              {isMC ? (
                                !ans?.chosen_choice_text && !ans?.chosen_choice_id && (
                                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.3rem 0' }}>
                                    (Opsi jawaban belum dipilih oleh siswa di aplikasi mobile)
                                  </div>
                                )
                              ) : (
                                <div style={{ marginTop: '0.2rem', padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem' }}>
                                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Jawaban Esai Siswa:</div>
                                  <div style={{ color: ans?.text_answer || activeFilePreview.studentAnswerText ? '#0f172a' : '#94a3b8', fontStyle: ans?.text_answer || activeFilePreview.studentAnswerText ? 'normal' : 'italic', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {ans?.text_answer || activeFilePreview.studentAnswerText || '(Belum ada jawaban teks esai yang diisi)'}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* 2. Written Answer / Student Submission Text (if no structured questions) */}
                {activeFilePreview.studentAnswerText && (!assignmentDetail?.questions || assignmentDetail.questions.length === 0) && (!selected?.questions || selected.questions.length === 0) && (!activeFilePreview.questions || activeFilePreview.questions.length === 0) && (!activeFilePreview.answers || activeFilePreview.answers.length === 0) && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Laporan / Catatan Pengerjaan Siswa:
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {activeFilePreview.studentAnswerText}
                    </div>
                  </div>
                )}

                {/* 3. Attached File (Image or PDF) */}
                {activeFilePreview.fileUrl && (
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                        Berkas Lampiran Lembar Kerja:
                      </div>
                      <a
                        href={activeFilePreview.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Buka Berkas Asli
                      </a>
                    </div>

                    {activeFilePreview.fileType === 'IMAGE' || activeFilePreview.fileUrl.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                      <div style={{ textAlign: 'center', background: '#0f172a', borderRadius: '6px', padding: '0.5rem' }}>
                        <img
                          src={activeFilePreview.fileUrl}
                          alt={activeFilePreview.fileName}
                          style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '4px' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '100%', minHeight: '380px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', background: '#f8fafc' }}>
                        <iframe
                          src={activeFilePreview.fileUrl}
                          title={activeFilePreview.fileName}
                          style={{ width: '100%', height: '380px', border: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Digital Confirmation (When assignment has no structured questions, no file, no answers, and no text) */}
                {!activeFilePreview.fileUrl && (!activeFilePreview.answers || activeFilePreview.answers.length === 0) && (!assignmentDetail?.questions || assignmentDetail.questions.length === 0) && (!selected?.questions || selected.questions.length === 0) && (!activeFilePreview.questions || activeFilePreview.questions.length === 0) && !activeFilePreview.studentAnswerText && (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc', textAlign: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem auto'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        <path d="M9 14l2 2 4-4"/>
                      </svg>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                      Lembar Pengumpulan Digital Tervalidasi
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem', maxWidth: '460px', margin: '0.25rem auto 0 auto', lineHeight: 1.5 }}>
                      Peserta didik <strong>{activeFilePreview.studentName}</strong> (NISN: {activeFilePreview.nisn}) telah mengonfirmasi penyelesaian tugas <strong>{activeFilePreview.assignmentTitle || selected.title}</strong> untuk mata pelajaran <strong>{activeFilePreview.subjectName}</strong> pada rombel <strong>{activeFilePreview.className || selected.className}</strong> melalui aplikasi mobile siswa.
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '20px', fontSize: '0.74rem', color: '#065f46', fontWeight: 600 }}>
                      <span>✓</span> Status: Diserahkan ({activeFilePreview.submittedAt || 'Tervalidasi Digital'})
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
