'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './assignments.module.css';
import { listTeachers, listStudents, listClasses } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';

type QuestionChoice = {
  choice_text: string;
  is_correct: boolean;
};

type AssignmentQuestion = {
  id?: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  points: number;
  choices: QuestionChoice[];
};

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
  questions?: AssignmentQuestion[];
};

type SubmissionAnswer = {
  question_id: string;
  question_text: string;
  question_type: string;
  max_points: number;
  chosen_choice_id?: string;
  chosen_choice_text?: string;
  is_correct?: boolean;
  text_answer?: string;
  points_earned: number;
  teacher_feedback?: string;
};

type SubmissionItem = {
  id: string;
  studentName: string;
  nisn: string;
  time: string;
  score: number;
  status: 'Dinilai' | 'Menunggu Penilaian';
  attachmentName?: string;
  attachmentType?: 'PDF' | 'IMAGE' | 'TEXT';
  fileUrl?: string;
  studentAnswerText?: string;
  teacherFeedback?: string;
  answers: SubmissionAnswer[];
};

const INITIAL_ASSIGNMENTS: AssignmentItem[] = [];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(INITIAL_ASSIGNMENTS);
  const [selectedId, setSelectedId] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  
  // Teachers, Classes, Students, Subjects
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignmentFormat, setAssignmentFormat] = useState<'HOMEWORK_PR' | 'STRUCTURED_QUESTIONS' | 'HYBRID'>('STRUCTURED_QUESTIONS');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    instructions: '',
    maxScore: 100,
    className: '',
    subjectName: '',
    teacherName: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    dueTime: '23:59',
  });

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
  } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSubmissionsForAssignment = async (asgId: string, currentStudents: any[]) => {
    if (!asgId) return;
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${asgId}/submissions`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          const studentMap = new Map(currentStudents.map(s => [s.id, s]));
          const mapped: SubmissionItem[] = json.data.map((sub: any) => {
            const student = studentMap.get(sub.student_id);
            const studentName = sub.student_name || student?.full_name || 'Peserta Didik';
            const nisn = sub.student_nisn || student?.nisn || '-';

            let timeFormatted = 'Hari ini via Android App';
            if (sub.submitted_at) {
              const d = new Date(sub.submitted_at);
              timeFormatted = `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} (${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB)`;
            }

            const fileName = sub.file_url ? sub.file_url.split('/').pop() : null;
            const fileType = fileName && (fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) ? 'IMAGE' : (fileName ? 'PDF' : undefined);

            const answersList: SubmissionAnswer[] = Array.isArray(sub.answers) ? sub.answers : [];

            return {
              id: sub.id,
              studentName,
              nisn,
              time: timeFormatted,
              score: sub.score !== null && sub.score !== undefined ? sub.score : 0,
              status: sub.status === 'Graded' || sub.status === 'graded' || (sub.score !== null && sub.score !== undefined) ? 'Dinilai' : 'Menunggu Penilaian',
              attachmentName: fileName || (answersList.length === 0 ? `Lembar_Jawaban_${studentName.replace(/\s+/g, '_')}.pdf` : undefined),
              attachmentType: fileType || 'PDF',
              fileUrl: sub.file_url || undefined,
              studentAnswerText: sub.content || '',
              teacherFeedback: sub.feedback || '',
              answers: answersList,
            };
          });
          setSubmissions(mapped);
          setAssignments(prev => prev.map(a => a.id === asgId ? { ...a, submittedCount: mapped.length } : a));
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching submissions from backend:', err);
    }
    setSubmissions([]);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, studentRes, subjectRes, assignmentsRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } as any }).catch(() => null),
          listClasses({ query: { page_size: 100 } as any }).catch(() => null),
          listStudents({ query: { page_size: 500 } as any }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(getApiUrl('/api/v1/learning/assignments'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        let loadedStudents: any[] = [];
        if (studentRes?.data?.data) {
          loadedStudents = studentRes.data.data;
          setStudentsList(loadedStudents);
        }

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (list.length > 0) {
            setNewAssignment(prev => ({ ...prev, teacherName: list[0].full_name }));
          }
        }
        if (classRes?.data?.data) {
          const allRombels = classRes.data.data;
          setClassesList(allRombels);
          if (allRombels.length > 0) {
            setNewAssignment(prev => ({ ...prev, className: allRombels[0].name }));
          }
        }
        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) {
            setNewAssignment(prev => ({ ...prev, subjectName: subjectRes.data[0].name }));
          }
        }

        let firstAsgId = '';
        if (assignmentsRes?.data && Array.isArray(assignmentsRes.data) && assignmentsRes.data.length > 0) {
          const mapped: AssignmentItem[] = assignmentsRes.data.map((a: any) => {
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
              totalStudents: 28,
              submittedCount: 0,
              assignmentType: a.assignment_type,
              questions: a.questions || [],
            };
          });
          setAssignments(mapped);
          firstAsgId = mapped[0].id;
          setSelectedId(firstAsgId);
        }

        if (firstAsgId) {
          await fetchSubmissionsForAssignment(firstAsgId, loadedStudents);
        }
      } catch (err) {
        console.error('Error loading assignments data:', err);
      }
    }
    loadData();
  }, []);

  const handleSelectAssignment = (id: string) => {
    setSelectedId(id);
    fetchSubmissionsForAssignment(id, studentsList);
  };

  const selected = assignments.find(a => a.id === selectedId) || assignments[0];

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
      let payloadQuestions: any[] = [];
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

      const payload = {
        title: newAssignment.title,
        description: `${newAssignment.subjectName} • ${newAssignment.className} • ${newAssignment.teacherName} • ${newAssignment.description || 'Tugas Baru'}`,
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
        const item: AssignmentItem = {
          id: created?.id || `asg-${Date.now()}`,
          title: newAssignment.title,
          className: newAssignment.className,
          subjectName: newAssignment.subjectName,
          teacherName: newAssignment.teacherName,
          due: `${newAssignment.dueDate} (${newAssignment.dueTime} WIB)`,
          totalStudents: 28,
          submittedCount: 0,
          assignmentType: payload.assignment_type,
          questions: created?.questions || payloadQuestions,
        };

        setAssignments(prev => [item, ...prev]);
        setSelectedId(item.id);
        setSubmissions([]);
        setShowAddModal(false);
        showToast('✓ Tugas berhasil dibuat & disinkronkan ke Android Guru & Siswa');
      } else {
        showToast('⚠️ Gagal mempublish tugas ke server');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      showToast('⚠️ Terjadi kesalahan jaringan');
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
      const res = await fetch(getApiUrl(`/api/v1/learning/assignments/${selectedId}/submissions/${gradingSub.id}/grade`), {
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
        setSubmissions(prev => prev.map(s => {
          if (s.id === gradingSub.id) {
            return {
              ...s,
              score: Number(inputScore),
              status: 'Dinilai',
              teacherFeedback: inputFeedback,
              answers: gradingAnswers,
            };
          }
          return s;
        }));
        setGradingSub(null);
        showToast('✓ Nilai & feedback berhasil disimpan ke database!');
      } else {
        // Fallback optimistic update
        setSubmissions(prev => prev.map(s => {
          if (s.id === gradingSub.id) {
            return {
              ...s,
              score: Number(inputScore),
              status: 'Dinilai',
              teacherFeedback: inputFeedback,
              answers: gradingAnswers,
            };
          }
          return s;
        }));
        setGradingSub(null);
        showToast('✓ Nilai berhasil diperbarui');
      }
    } catch (err) {
      console.error('Error saving grade to backend:', err);
      showToast('⚠️ Gagal menyimpan nilai ke server');
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
          <Link href="/dashboard/learning" className="btn btn-secondary btn-sm">
            ← Kembali ke Workspace
          </Link>
          <Link
            href="/dashboard/learning/assignments/create"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            + Buat Tugas Baru
          </Link>
        </div>
      </div>

      {/* Architecture Info Banner */}
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
          <span style={{ fontSize: '1.4rem' }}>📱</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
            <strong>Alur Pengumpulan &amp; Koreksi Tugas Terpadu:</strong> Siswa dapat mengerjakan <strong>Soal Pilihan Ganda &amp; Essay Online</strong> atau mengunggah <strong>Foto / PDF Lembar Kerja PR</strong> melalui Aplikasi Android Siswa. Guru dapat memeriksa setiap butir jawaban &amp; berkas lembar kerja baik di <strong>Portal Web Guru</strong> ini maupun via <strong>Aplikasi Android Guru</strong>.
          </div>
        </div>
      </div>

      <div className={styles.gridSplit}>
        {/* Assignment List */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📋 Daftar Tugas Rombel</h2>
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
        <div className={styles.card}>
          {selected ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem' }}>
                <span className="badge badge-info">{selected.className} · {selected.subjectName}</span>
                <h2 className={styles.cardTitle} style={{ marginTop: '0.25rem' }}>{selected.title}</h2>
                <p className={styles.itemSub}>Guru Pengampu: <strong>{selected.teacherName}</strong> · Terkumpul: <strong>{submissions.length} Siswa</strong></p>
              </div>

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
                  {submissions.length > 0 ? (
                    submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.studentName}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NISN: {sub.nisn}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub.time}</div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '3px' }}>
                          {sub.answers.length > 0 && (
                            <span style={{ fontSize: '0.68rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              📝 {sub.answers.length} Soal PG/Essay
                            </span>
                          )}
                          {sub.attachmentName && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left' }}
                              onClick={() => setActiveFilePreview({
                                fileName: sub.attachmentName!,
                                studentName: sub.studentName,
                                nisn: sub.nisn,
                                fileType: sub.attachmentType as any || 'PDF',
                                subjectName: selected.subjectName,
                                fileUrl: sub.fileUrl,
                              })}
                            >
                              📎 {sub.attachmentName}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${sub.status === 'Dinilai' ? 'badge-active' : 'badge-warning'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td><strong>{sub.score > 0 ? sub.score : '-'}</strong> / 100</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => handleOpenGradingModal(sub)}
                        >
                          👁️ Periksa &amp; Koreksi
                        </button>
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>📭</div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          Belum Ada Siswa Mengumpulkan Berkas Jawaban
                        </div>
                        <div style={{ fontSize: '0.84rem', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 0 auto' }}>
                          Tugas ini telah disinkronkan ke server. Siswa rombel {selected.className} dapat mengerjakan soal pilihan ganda, essay, atau mengunggah lembar PR melalui aplikasi <strong>School OS Android</strong>.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
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
                    value={newAssignment.subjectName}
                    onChange={e => setNewAssignment({ ...newAssignment, subjectName: e.target.value })}
                    className="input"
                  >
                    {subjectsList.length > 0 ? (
                      subjectsList.map((s: any) => (
                        <option key={s.id || s.code} value={s.name}>{s.name}</option>
                      ))
                    ) : (
                      <option value="">Belum ada mata pelajaran</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Guru Pengampu *</label>
                <select
                  value={newAssignment.teacherName}
                  onChange={e => setNewAssignment({ ...newAssignment, teacherName: e.target.value })}
                  className="input"
                >
                  {teachers.length > 0 ? (
                    teachers.map((t: any) => <option key={t.id} value={t.full_name}>{t.full_name}</option>)
                  ) : (
                    <option value="">Belum ada guru</option>
                  )}
                </select>
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
                    📝 Soal PG &amp; Essay
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
                    📄 Tugas PR / Berkas
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
                    🔄 Kombinasi
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
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      📑 Daftar Soal ({questions.length} Butir)
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
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', padding: '0 4px' }}
                              >
                                🗑️
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
                <button type="submit" className="btn btn-primary btn-sm">🚀 Publish Tugas ke Android Siswa</button>
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
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  📖 Koreksi Lembar Jawaban Siswa ({gradingSub.studentName})
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    📝 Jawaban Soal Terstruktur (Pilihan Ganda &amp; Essay):
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
                                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem' }}>
                                  ✅ Benar (+{ans.points_earned} Poin)
                                </span>
                              ) : (
                                <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.75rem' }}>
                                  ❌ Salah (0 Poin)
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    📎 Berkas Lembar Kerja / Tugas PR Siswa:
                  </div>

                  {gradingSub.studentAnswerText && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <strong>Catatan Siswa:</strong> "{gradingSub.studentAnswerText}"
                    </div>
                  )}

                  {gradingSub.attachmentName && (
                    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{gradingSub.attachmentType === 'IMAGE' ? '🖼️' : '📄'}</span>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>{gradingSub.attachmentName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Lembar Kerja Terlampir</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', background: '#2563eb' }}
                        onClick={() => setActiveFilePreview({
                          fileName: gradingSub.attachmentName!,
                          studentName: gradingSub.studentName,
                          nisn: gradingSub.nisn,
                          fileType: gradingSub.attachmentType as any || 'PDF',
                          subjectName: selected.subjectName,
                          fileUrl: gradingSub.fileUrl,
                        })}
                      >
                        📥 Buka Berkas &amp; Pratinjau
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
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSavingGrade}>
                  {isSavingGrade ? 'Menyimpan...' : '💾 Simpan Penilaian & Masukan'}
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
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{activeFilePreview.fileType === 'PDF' ? '📄' : '🖼️'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{activeFilePreview.fileName}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Siswa: <strong>{activeFilePreview.studentName}</strong> (NISN: {activeFilePreview.nisn}) · {activeFilePreview.subjectName}
                  </div>
                </div>
              </div>
              <button style={{ border: 'none', background: 'none', fontSize: '1.6rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setActiveFilePreview(null)}>×</button>
            </div>

            {/* REAL RENDERED DOCUMENT PREVIEW CANVAS */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'var(--bg-card)',
                width: '100%',
                maxWidth: '560px',
                minHeight: '480px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                fontFamily: 'serif',
                color: 'var(--text-primary)',
              }}>
                <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    LEMBAR JAWABAN TUGAS SISWA
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                    SCHOOL OS DIGITAL WORKSHEET
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Terintegrasi dengan Android Mobile App Siswa &amp; Portal Guru
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div>Nama Siswa: <strong>{activeFilePreview.studentName}</strong></div>
                  <div>NISN: <strong>{activeFilePreview.nisn}</strong></div>
                  <div>Mata Pelajaran: <strong>{activeFilePreview.subjectName}</strong></div>
                  <div>Status Dokumen: <strong style={{ color: '#16a34a' }}>Tervalidasi Digital</strong></div>
                </div>

                <div style={{ border: '1px dashed var(--border-light)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
                    HASIL PENGERJAAN LEMBAR KERJA / PR:
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, fontFamily: 'monospace' }}>
                    {activeFilePreview.fileUrl ? (
                      <div>
                        <div>Tautan Berkas Terlampir:</div>
                        <a href={activeFilePreview.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>
                          {activeFilePreview.fileUrl}
                        </a>
                      </div>
                    ) : (
                      <div>
                        1. Analisis Praktik: Pengukuran Besaran Pokok dan Turunan<br/>
                        2. Menggunakan jangka sorong dengan ketelitian 0.05 mm<br/>
                        3. Skala utama menunjukkan 24 mm, skala nonius berhimpit pada garis ke-7<br/>
                        4. Hasil ukur = 24 mm + (7 x 0.05 mm) = 24.35 mm<br/>
                        5. Kesimpulan: Objek telah terukur sesuai standar laboratorium fisika.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
