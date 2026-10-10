'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './quizzes.module.css';
import { listTeachers, listClasses, listStudents } from '@/lib/sdk/sdk.gen';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type QuizItem = {
  id: string;
  title: string;
  subject: string;
  classRoom: string;
  teacherName: string;
  duration: string;
  durationMinutes: number;
  totalQuestions: number;
  status: 'PUBLISHED' | 'LIVE_EXAM' | 'DRAFT' | string;
  participants: number;
  maxParticipants: number;
  avgScore: number;
  examMode?: string;
  examToken?: string | null;
  startAt?: string | null;
  endAt?: string | null;
};

type StudentCbtScore = {
  id: string;
  studentId?: string;
  nisn: string;
  studentName: string;
  score: number;
  timeSpent: string;
  correctAnswers: number;
  totalQuestions: number;
  status: 'Lulus KKM' | 'Remedial' | 'Sedang Mengerjakan';
};

type AttemptAnswerDetail = {
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

type AttemptDetailState = {
  attemptId: string;
  studentName: string;
  studentNisn: string;
  score: number;
  answers: AttemptAnswerDetail[];
};

type QuizChoiceItem = {
  id?: string;
  choice_text: string;
  order_index?: number;
  is_correct?: boolean;
};

type QuizQuestionItem = {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  image_url?: string | null;
  choices: QuizChoiceItem[];
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

const INITIAL_QUIZZES: QuizItem[] = [];

export default function QuizzesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes('guru') || user?.role?.toLowerCase().includes('teacher') || user?.role?.toLowerCase().includes('pengajar');

  const [activeView, setActiveView] = useState<'LIST' | 'ANALYSIS' | 'QUESTIONS'>('LIST');
  const [quizzes, setQuizzes] = useState<QuizItem[]>(INITIAL_QUIZZES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Teachers, Classes, Subjects
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [cbtScores, setCbtScores] = useState<StudentCbtScore[]>([]);

  // Modal Buat Kuis Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    passingScore: 70,
    examDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '09:00',
    subject: '',
    classRoom: '',
    teacherName: '',
    duration: '45 Menit',
    totalQuestions: 20,
  });

  // Modal Atur Jadwal Ujian (Tanggal & Jam Mulai/Selesai)
  const [scheduleQuiz, setScheduleQuiz] = useState<QuizItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    startDate: '',
    startTime: '07:30',
    endDate: '',
    endTime: '09:00',
    durationMinutes: 45,
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Modal Publish Kuis
  const [publishingQuiz, setPublishingQuiz] = useState<QuizItem | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Selected Quiz Analysis State (In-Page)
  const [analyzedQuiz, setAnalyzedQuiz] = useState<QuizItem | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [inspectingAttempt, setInspectingAttempt] = useState<AttemptDetailState | null>(null);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Bank Soal & Butir Soal State (In-Page)
  const [viewQuestionsQuiz, setViewQuestionsQuiz] = useState<QuizItem | null>(null);
  const [questionsList, setQuestionsList] = useState<QuizQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<'MULTIPLE_CHOICE' | 'ESSAY'>('MULTIPLE_CHOICE');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState(25);
  const [newChoices, setNewChoices] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
        const [teacherRes, classRes, studentRes, subjectRes, quizRes] = await Promise.all([
          listTeachers({ query: { page_size: 100 } }).catch(() => null),
          listClasses({ query: { page_size: 100 } }).catch(() => null),
          listStudents({ query: { page_size: 100 } }).catch(() => null),
          fetch(getApiUrl('/api/v1/academic/subjects'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(getApiUrl('/api/v1/learning/quizzes'), {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (teacherRes?.data?.data) {
          const list = teacherRes.data.data;
          setTeachers(list);
          if (isTeacher && user?.full_name) {
            setNewQuiz(prev => ({ ...prev, teacherName: user.full_name || '' }));
          } else if (list.length > 0) {
            setNewQuiz(prev => ({ ...prev, teacherName: prev.teacherName || list[0].full_name }));
          }
        }

        if (classRes?.data?.data) {
          const allRombels = classRes.data.data;
          setClassesList(allRombels);
          if (allRombels.length > 0) setNewQuiz(prev => ({ ...prev, classRoom: allRombels[0].name }));
        }

        if (subjectRes?.data && Array.isArray(subjectRes.data)) {
          setSubjectsList(subjectRes.data);
          if (subjectRes.data.length > 0) setNewQuiz(prev => ({ ...prev, subject: subjectRes.data[0].name }));
        }

        if (quizRes?.data && Array.isArray(quizRes.data) && quizRes.data.length > 0) {
          const rawList = quizRes.data;
          const filteredList = isTeacher && user?.full_name
            ? rawList.filter((q: Record<string, unknown>) => {
                const tName = String(q.teacher_name || '').toLowerCase();
                const uName = (user.full_name || '').toLowerCase();
                return tName === uName || q.created_by === user.id || q.teacher_id === user.id;
              })
            : rawList;

          const mapped: QuizItem[] = filteredList.map((q: Record<string, unknown>) => {
            const dur = Number(q.duration_minutes || q.time_limit_minutes || 30);
            const rawStatus = String(q.status || 'draft').toUpperCase();
            const normalizedStatus = (rawStatus === 'PUBLISHED' || rawStatus === 'ACTIVE')
              ? 'PUBLISHED'
              : (rawStatus === 'LIVE_EXAM' || rawStatus === 'LIVE')
              ? 'LIVE_EXAM'
              : 'DRAFT';

            return {
              id: String(q.id),
              title: String(q.title || ''),
              subject: String(q.subject_name || '-'),
              classRoom: String(q.class_name || '-'),
              teacherName: String(q.teacher_name || '-'),
              duration: `${dur} Menit`,
              durationMinutes: dur,
              totalQuestions: Number(q.questions_count) || 0,
              status: normalizedStatus,
              participants: 0,
              maxParticipants: 28,
              avgScore: 0,
              examMode: String(q.exam_mode || 'HOMEWORK_QUIZ'),
              examToken: q.exam_token ? String(q.exam_token) : null,
              startAt: q.start_at ? String(q.start_at) : null,
              endAt: q.end_at ? String(q.end_at) : null,
            };
          });
          setQuizzes(mapped);
        }
      } catch (err) {
        console.error('Error loading quizzes data:', err);
      }
    };

    loadData();
  }, [isTeacher, user?.full_name, user?.id]);

  const handleOpenAnalysisModal = async (q: QuizItem) => {
    setAnalyzedQuiz(q);
    setActiveView('ANALYSIS');
    setInspectingAttempt(null);
    setLoadingAnalysis(true);
    setAnalysisError(null);
    setCbtScores([]);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${q.id}/attempts`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        const attempts = json.data || [];
        const mapped: StudentCbtScore[] = attempts.map((a: Record<string, unknown>) => {
          let timeSpentText = '-';
          if (a.completed_at && a.started_at) {
            const mins = Math.max(1, Math.round((new Date(String(a.completed_at)).getTime() - new Date(String(a.started_at)).getTime()) / 60000));
            timeSpentText = `${mins} Menit`;
          } else if (a.status === 'in_progress') {
            timeSpentText = 'Sedang Mengerjakan ';
          }
          const totalPts = Number(a.total_points) || 100;
          const scoreVal = a.percentage != null 
            ? Number(a.percentage) 
            : (a.score != null ? Math.round((Number(a.score) * 100) / totalPts) : 0);
          const isPassed = typeof a.passed === 'boolean' ? a.passed : scoreVal >= 75;
          const answersArr = Array.isArray(a.answers) ? a.answers : [];
          const correctCount = answersArr.filter((ans: Record<string, unknown>) => ans.is_correct || (Number(ans.points_earned) > 0)).length;
          
          return {
            id: String(a.id),
            studentId: String(a.student_id || ''),
            nisn: String(a.student_nisn || '-'),
            studentName: String(a.student_name || 'Siswa'),
            score: scoreVal,
            timeSpent: timeSpentText,
            correctAnswers: answersArr.length > 0 ? correctCount : (Number(a.score) || 0),
            totalQuestions: answersArr.length > 0 ? answersArr.length : q.totalQuestions,
            status: a.status === 'in_progress' ? 'Sedang Mengerjakan' : (isPassed ? 'Lulus KKM' : 'Remedial'),
          };
        });
        setCbtScores(mapped);
      } else {
        setAnalysisError('Gagal memuat riwayat ujian siswa dari server');
      }
    } catch (err) {
      console.error('Failed to load quiz attempts:', err);
      setAnalysisError('Terjadi kesalahan jaringan saat memuat analisis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleInspectStudentAttempt = async (attemptId: string, studentName: string, nisn: string, score: number) => {
    if (!analyzedQuiz) return;
    if (inspectingAttempt?.attemptId === attemptId) {
      setInspectingAttempt(null);
      return;
    }
    setLoadingAttemptDetail(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${analyzedQuiz.id}/attempts/${attemptId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        const answers: AttemptAnswerDetail[] = data.answers || [];
        setInspectingAttempt({
          attemptId,
          studentName,
          studentNisn: nisn,
          score,
          answers,
        });
        const scores: Record<string, number> = {};
        const feedbacks: Record<string, string> = {};
        answers.forEach((ans) => {
          scores[ans.question_id] = ans.points_earned || 0;
          feedbacks[ans.question_id] = ans.teacher_feedback || '';
        });
        setGradingScores(scores);
        setGradingFeedbacks(feedbacks);
      } else {
        showToast('⚠️ Gagal memuat lembar jawaban siswa');
      }
    } catch (err) {
      console.error('Error fetching attempt detail:', err);
      showToast('⚠️ Terjadi kesalahan jaringan');
    } finally {
      setLoadingAttemptDetail(false);
    }
  };

  const handleSaveGrade = async (attemptId: string) => {
    if (!analyzedQuiz || !inspectingAttempt) return;
    setIsSavingGrade(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const answerGrades = inspectingAttempt.answers.map(ans => ({
        question_id: ans.question_id,
        points_earned: gradingScores[ans.question_id] !== undefined ? Number(gradingScores[ans.question_id]) : ans.points_earned,
        teacher_feedback: gradingFeedbacks[ans.question_id] || undefined,
      }));

      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${analyzedQuiz.id}/attempts/${attemptId}/grade`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ answer_grades: answerGrades }),
      });

      if (res.ok) {
        showToast('✓ Penilaian berhasil disimpan & nilai otomatis diperbarui ke siswa!');
        await handleOpenAnalysisModal(analyzedQuiz);
        setInspectingAttempt(null);
      } else {
        showToast('⚠️ Gagal menyimpan penilaian');
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      showToast('⚠️ Terjadi kesalahan jaringan');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const formatScheduleIndo = (startAt?: string | null, endAt?: string | null) => {
    if (!startAt) return null;
    try {
      const sDate = new Date(startAt);
      if (isNaN(sDate.getTime())) return null;

      const dateStr = sDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const startTimeStr = sDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      let endTimeStr = '';
      if (endAt) {
        const eDate = new Date(endAt);
        if (!isNaN(eDate.getTime())) {
          endTimeStr = eDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        }
      }

      return {
        dateStr,
        timeStr: endTimeStr ? `${startTimeStr} - ${endTimeStr} WIB` : `Mulai ${startTimeStr} WIB`,
      };
    } catch {
      return null;
    }
  };

  const handleOpenScheduleModal = (q: QuizItem) => {
    const today = new Date().toISOString().split('T')[0];
    let sDate = today;
    let sTime = '07:30';
    let eDate = today;
    let eTime = '09:00';

    if (q.startAt) {
      try {
        const d = new Date(q.startAt);
        if (!isNaN(d.getTime())) {
          sDate = d.toISOString().split('T')[0];
          sTime = d.toTimeString().slice(0, 5);
        }
      } catch {}
    }
    if (q.endAt) {
      try {
        const d = new Date(q.endAt);
        if (!isNaN(d.getTime())) {
          eDate = d.toISOString().split('T')[0];
          eTime = d.toTimeString().slice(0, 5);
        }
      } catch {}
    }

    setScheduleForm({
      startDate: sDate,
      startTime: sTime,
      endDate: eDate,
      endTime: eTime,
      durationMinutes: q.durationMinutes || parseInt(q.duration.replace(/\D/g, '')) || 45,
    });
    setScheduleQuiz(q);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleQuiz) return;

    setIsSavingSchedule(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      let startAtIso: string | null = null;
      let endAtIso: string | null = null;
      if (scheduleForm.startDate && scheduleForm.startTime) {
        startAtIso = new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}:00`).toISOString();
      }
      if (scheduleForm.endDate && scheduleForm.endTime) {
        endAtIso = new Date(`${scheduleForm.endDate}T${scheduleForm.endTime}:00`).toISOString();
      }

      const payload = {
        duration_minutes: Number(scheduleForm.durationMinutes) || 45,
        start_at: startAtIso,
        end_at: endAtIso,
      };

      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${scheduleQuiz.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('✓ Jadwal pelaksanaan ujian CBT berhasil disimpan & disinkronkan!');
        setQuizzes(prev => prev.map(q => q.id === scheduleQuiz.id ? {
          ...q,
          duration: `${scheduleForm.durationMinutes} Menit`,
          durationMinutes: scheduleForm.durationMinutes,
          startAt: startAtIso,
          endAt: endAtIso,
        } : q));
        setScheduleQuiz(null);
      } else {
        showToast('⚠️ Gagal menyimpan jadwal kuis');
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      showToast('⚠️ Terjadi kesalahan jaringan saat menyimpan jadwal');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handlePublishQuiz = async (quiz: QuizItem) => {
    if (quiz.totalQuestions === 0) {
      showToast('⚠️ Kuis harus memiliki minimal 1 butir soal sebelum dipublish!');
      setPublishingQuiz(null);
      handleOpenQuestionsModal(quiz);
      return;
    }

    setIsPublishing(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${quiz.id}/publish`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        showToast(`✓ Kuis "${quiz.title}" berhasil dipublish & otomatis tersinkronkan ke HP Siswa!`);
        setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: 'PUBLISHED' } : q));
        if (viewQuestionsQuiz && viewQuestionsQuiz.id === quiz.id) {
          setViewQuestionsQuiz(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
        }
        setPublishingQuiz(null);
      } else {
        const errJson = await res.json().catch(() => null);
        showToast(`⚠️ Gagal mempublish kuis: ${errJson?.error?.message || 'Pastikan kuis memiliki minimal 1 butir soal'}`);
      }
    } catch (err) {
      console.error('Error publishing quiz:', err);
      showToast('⚠️ Terjadi kesalahan jaringan saat mempublish kuis');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuiz.title) return;

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const durationMinutes = parseInt(newQuiz.duration.replace(/\D/g, '')) || 45;
      const effectiveTeacherName = (isTeacher && user?.full_name) ? user.full_name : (newQuiz.teacherName || user?.full_name || 'Guru');

      let startAtIso: string | undefined = undefined;
      let endAtIso: string | undefined = undefined;
      if (newQuiz.startDate && newQuiz.startTime) {
        startAtIso = new Date(`${newQuiz.startDate}T${newQuiz.startTime}:00`).toISOString();
      }
      if (newQuiz.endDate && newQuiz.endTime) {
        endAtIso = new Date(`${newQuiz.endDate}T${newQuiz.endTime}:00`).toISOString();
      }

      const payload = {
        title: newQuiz.title,
        description: `${newQuiz.subject} • ${newQuiz.classRoom} • ${effectiveTeacherName} • ${newQuiz.description || 'Kuis online CBT'}`,
        duration_minutes: durationMinutes,
        passing_score: Number(newQuiz.passingScore) || 70,
        class_id: newQuiz.classRoom,
        start_at: startAtIso,
        end_at: endAtIso,
      };

      const res = await fetch(getApiUrl('/api/v1/learning/quizzes'), {
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

        const item: QuizItem = {
          id: created?.id || `quiz-${Date.now()}`,
          title: newQuiz.title,
          subject: newQuiz.subject,
          classRoom: newQuiz.classRoom,
          teacherName: effectiveTeacherName,
          duration: `${durationMinutes} Menit`,
          durationMinutes: durationMinutes,
          totalQuestions: 0,
          status: 'DRAFT',
          participants: 0,
          maxParticipants: 28,
          avgScore: 0,
          startAt: startAtIso,
          endAt: endAtIso,
        };

        setQuizzes(prev => [item, ...prev]);
        setShowAddModal(false);
        showToast('✓ Kuis baru tersimpan sebagai Draft. Silakan tambahkan butir soal di menu "Butir Soal", lalu klik Publish!');
      } else {
        showToast('⚠️ Gagal membuat kuis baru');
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      showToast('⚠️ Terjadi kesalahan jaringan');
    }
  };

  // Open Question Bank & Items
  const handleOpenQuestionsModal = async (quiz: QuizItem) => {
    setViewQuestionsQuiz(quiz);
    setActiveView('QUESTIONS');
    setLoadingQuestions(true);
    setShowAddQuestion(false);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${quiz.id}/questions`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setQuestionsList(json.data);
        } else {
          setQuestionsList([]);
        }
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Add a new Question (Multiple Choice or Essay)
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewQuestionsQuiz || !newQuestionText.trim()) return;

    setSavingQuestion(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const payload = {
        question_text: newQuestionText,
        question_type: newQuestionType,
        points: Number(newQuestionPoints) || 10,
        order_index: questionsList.length + 1,
        choices: newQuestionType === 'MULTIPLE_CHOICE' ? newChoices.map((c, i) => ({
          choice_text: c.text,
          is_correct: c.isCorrect,
          order_index: i + 1,
        })) : [],
      };

      const res = await fetch(getApiUrl(`/api/v1/learning/quizzes/${viewQuestionsQuiz.id}/questions`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('✓ Butir soal berhasil ditambahkan & disinkronkan!');
        setNewQuestionText('');
        setNewChoices([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]);
        setShowAddQuestion(false);

        // Reload questions
        const qRes = await fetch(getApiUrl(`/api/v1/learning/quizzes/${viewQuestionsQuiz.id}/questions`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (qRes.ok) {
          const json = await qRes.json();
          if (json.data && Array.isArray(json.data)) {
            setQuestionsList(json.data);
            setQuizzes(prev => prev.map(q => q.id === viewQuestionsQuiz.id ? { ...q, totalQuestions: json.data.length } : q));
            setViewQuestionsQuiz(prev => prev ? { ...prev, totalQuestions: json.data.length } : null);
          }
        }
      } else {
        showToast('⚠️ Gagal menyimpan butir soal');
      }
    } catch (err) {
      console.error('Error adding question:', err);
      showToast('⚠️ Terjadi kesalahan jaringan');
    } finally {
      setSavingQuestion(false);
    }
  };

  const exportCbtCsv = (quizTitle: string) => {
    const headers = 'NISN,Nama Siswa,Skor CBT (0-100),Waktu Pengerjaan,Jawaban Benar,Status KKM\n';
    const rows = cbtScores.map(s => `"${s.nisn}","${s.studentName}","${s.score}","${s.timeSpent}","${s.correctAnswers}/${s.totalQuestions}","${s.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hasil_CBT_${quizTitle.replace(/\s+/g, '_')}.csv`;
    a.click();
    showToast('✓ File CSV berhasil diunduh');
  };

  const filtered = quizzes.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase()) || q.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // --- Client-Side Pagination ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const totalPgCount = questionsList.filter(q => q.question_type.toUpperCase().includes('CHOICE') || q.question_type.toUpperCase() === 'PG').length;
  const totalEssayCount = questionsList.filter(q => !q.question_type.toUpperCase().includes('CHOICE') && q.question_type.toUpperCase() !== 'PG').length;
  const totalCumulativePoints = questionsList.reduce((acc, q) => acc + (q.points || 0), 0);

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

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title} style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            {activeView === 'ANALYSIS' ? 'Analisis Nilai & Hasil Ujian CBT Siswa' : activeView === 'QUESTIONS' ? 'Bank & Butir Soal CBT' : 'Kuis & Ujian Online (CBT)'}
          </h1>
          <p className={styles.subtitle}>
            {activeView === 'ANALYSIS' && analyzedQuiz
              ? `${analyzedQuiz.title} • ${analyzedQuiz.subject} (${analyzedQuiz.classRoom}) • Guru: ${analyzedQuiz.teacherName}`
              : activeView === 'QUESTIONS' && viewQuestionsQuiz
              ? `${viewQuestionsQuiz.title} • ${viewQuestionsQuiz.subject} (${viewQuestionsQuiz.classRoom})`
              : 'Manajemen Bank Soal (Pilihan Ganda & Soal Uraian), Sinkronisasi Portal Android Guru & CBT Siswa'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeView === 'QUESTIONS' && (
            <>
              {viewQuestionsQuiz && (
                viewQuestionsQuiz.status === 'DRAFT' ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setPublishingQuiz(viewQuestionsQuiz)}
                    style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                  >
                    <span>📢 Publish Kuis ({questionsList.length} Soal)</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.28rem 0.65rem', borderRadius: '6px' }}>
                    ✓ Kuis Published (Aktif)
                  </span>
                )
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddQuestion(prev => !prev)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                {showAddQuestion ? '✕ Tutup Form' : '+ Tambah Butir Soal Baru'}
              </button>
              <button
                onClick={() => {
                  setActiveView('LIST');
                  setViewQuestionsQuiz(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                ← Kembali ke Daftar Kuis CBT
              </button>
            </>
          )}

          {activeView === 'ANALYSIS' && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => analyzedQuiz && handleOpenAnalysisModal(analyzedQuiz)}
                disabled={loadingAnalysis}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loadingAnalysis ? 'spinning' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                <span>{loadingAnalysis ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => analyzedQuiz && exportCbtCsv(analyzedQuiz.title)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span>Ekspor CSV</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('LIST');
                  setAnalyzedQuiz(null);
                  setInspectingAttempt(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                ← Kembali ke Daftar Kuis CBT
              </button>
            </>
          )}

          {activeView === 'LIST' && (
            <Link href="/dashboard/learning" className="btn btn-secondary btn-sm">
              ← Kembali ke Workspace
            </Link>
          )}
        </div>
      </div>

      {activeView === 'LIST' && (
        <>
          {/* Top Action Row (Enterprise Style - Screenshot Match) */}
          <div className="tableActionRow">
            <Link href="/dashboard/learning/quizzes/create" className="tableActionBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Bank &amp; Butir Soal</span>
            </Link>

            <button
              className="tableActionBtn"
              onClick={() => {
                if (quizzes.length > 0) {
                  exportCbtCsv(quizzes[0].title);
                } else {
                  showToast('Belum ada data kuis untuk diekspor');
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Ekspor Hasil CBT (CSV)</span>
            </button>
          </div>

          {/* Table Card (Screenshot Match) */}
          <div className="tableCard">
            {/* Table Toolbar */}
            <div className="tableToolbar">
              <div className="tableInfoText">
                Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong>{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of{' '}
                <strong>{filtered.length}</strong> entries
                {filtered.length !== quizzes.length && (
                  <span> (filtered from <strong>{quizzes.length}</strong> total entries)</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="tableSearchBox">
                  <input
                    type="text"
                    placeholder="Cari kuis, mapel, atau guru..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="tableSearchInput"
                  />
                  <svg className="tableSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="entriesSelect"
                  style={{ minWidth: '130px', height: '34px' }}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="LIVE_EXAM">Live Exam</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Belum Ada Kuis atau Ujian CBT Terdaftar
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px', margin: '8px auto 18px', lineHeight: 1.5 }}>
                  Belum ada kuis atau ujian online CBT yang dibuat oleh guru. Klik tombol <strong>+ Buat &amp; Publish Kuis CBT</strong> di atas untuk menambahkan ujian bagi siswa.
                </p>
                <button className="tableActionBtn" onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', margin: '0 auto' }}>
                  + Buat &amp; Publish Kuis CBT Baru
                </button>
              </div>
            ) : (
              <div className="tableWrap">
                <table className={`table ${styles.table}`} style={{ tableLayout: 'auto', minWidth: '1080px' }}>
                  <thead>
                    <tr>
                      <th className="thSortable" style={{ minWidth: '220px' }}>
                        <div className="thSortContent">
                          <span>Judul Kuis / Ujian CBT</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '140px' }}>
                        <div className="thSortContent">
                          <span>Mapel &amp; Guru</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '95px' }}>
                        <div className="thSortContent">
                          <span>Rombel</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '180px' }}>
                        <div className="thSortContent">
                          <span>Jadwal Pelaksanaan</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '110px' }}>
                        <div className="thSortContent">
                          <span>Durasi &amp; Soal</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '95px' }}>
                        <div className="thSortContent">
                          <span>Status</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th className="thSortable" style={{ minWidth: '120px' }}>
                        <div className="thSortContent">
                          <span>Peserta &amp; Nilai</span>
                          <span className="sortArrows">⇅</span>
                        </div>
                      </th>
                      <th style={{ textAlign: 'right', minWidth: '160px', whiteSpace: 'nowrap' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((q) => {
                      const sched = formatScheduleIndo(q.startAt, q.endAt);
                      return (
                        <tr key={q.id}>
                          {/* 1. Judul Kuis */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <div
                              className="itemPrimaryTitle"
                              style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.35 }}
                              onClick={() => handleOpenQuestionsModal(q)}
                              title="Klik untuk melihat / mengedit butir soal CBT"
                            >
                              <span>{q.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'nowrap' }}>
                              <span style={{
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                color: q.examMode === 'PROCTORED_CBT' ? '#b91c1c' : '#6d28d9',
                                background: q.examMode === 'PROCTORED_CBT' ? '#fef2f2' : '#f5f3ff',
                                border: q.examMode === 'PROCTORED_CBT' ? '1px solid #fecaca' : '1px solid #ddd6fe',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                {q.examMode === 'PROCTORED_CBT' ? '🛡️ Proctored' : '✓ CBT Android'}
                              </span>
                              {q.examToken ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(q.examToken || '');
                                    showToast(`✓ Token ujian "${q.examToken}" disalin ke clipboard!`);
                                  }}
                                  title="Klik untuk salin token ujian CBT"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    color: '#1e40af',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <span>🔑 {q.examToken}</span>
                                  <span style={{ fontSize: '0.58rem', opacity: 0.7 }}>📋</span>
                                </button>
                              ) : null}
                            </div>
                          </td>

                          {/* 2. Mapel & Guru */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <span className="statusPill statusPillMuted" style={{ fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                              {q.subject}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>
                              {q.teacherName}
                            </div>
                          </td>

                          {/* 3. Rombel Target */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#334155',
                              background: '#f1f5f9',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                              whiteSpace: 'nowrap'
                            }}>
                              {q.classRoom}
                            </span>
                          </td>

                          {/* 4. Jadwal Pelaksanaan */}
                          <td style={{ verticalAlign: 'middle' }}>
                            {sched ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                  <span style={{ color: '#2563eb' }}>📅</span>
                                  <span>{sched.dateStr}</span>
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  <span>⏰</span>
                                  <span>{sched.timeStr}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenScheduleModal(q)}
                                    title="Ubah tanggal dan jam pelaksanaan ujian CBT"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      fontSize: '0.7rem',
                                      opacity: 0.75,
                                    }}
                                  >
                                    ✏️
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(q)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: '#b45309',
                                  background: '#fef3c7',
                                  border: '1px solid #fde68a',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Klik untuk mengatur tanggal dan jam ujian CBT"
                              >
                                <span>📅 + Atur Jadwal</span>
                              </button>
                            )}
                          </td>

                          {/* 5. Durasi & Soal */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                ⏱️ {q.duration}
                              </div>
                              <div
                                style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
                                onClick={() => handleOpenQuestionsModal(q)}
                                title="Klik untuk melihat daftar butir soal"
                              >
                                📝 <strong>{q.totalQuestions}</strong> Soal
                              </div>
                            </div>
                          </td>

                          {/* 6. Status Ujian */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '999px',
                                whiteSpace: 'nowrap',
                                background: q.status === 'PUBLISHED' ? '#dcfce7' : q.status === 'LIVE_EXAM' ? '#f3e8ff' : '#f1f5f9',
                                color: q.status === 'PUBLISHED' ? '#15803d' : q.status === 'LIVE_EXAM' ? '#7e22ce' : '#475569',
                                border: `1px solid ${q.status === 'PUBLISHED' ? '#bbf7d0' : q.status === 'LIVE_EXAM' ? '#e9d5ff' : '#cbd5e1'}`,
                              }}
                            >
                              {q.status === 'PUBLISHED' ? '🟢 Aktif' : q.status === 'LIVE_EXAM' ? '⚡ Live' : '⚪ Draft'}
                            </span>
                          </td>

                          {/* 7. Peserta & Nilai */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>
                              👥 {q.participants}/{q.maxParticipants} Peserta
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              Rata-rata: <strong>{q.avgScore > 0 ? q.avgScore : '—'}</strong>
                            </div>
                          </td>

                          {/* 8. Aksi (Strict Single-Line Horizontal Group) */}
                          <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{
                              display: 'inline-flex',
                              gap: '0.35rem',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              flexWrap: 'nowrap',
                              whiteSpace: 'nowrap'
                            }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.26rem 0.52rem',
                                  fontSize: '0.74rem',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: '#fff',
                                }}
                                onClick={() => handleOpenQuestionsModal(q)}
                                title="Kelola butir soal CBT ini"
                              >
                                <span>📝 Soal ({q.totalQuestions})</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.26rem 0.52rem',
                                  fontSize: '0.74rem',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: '#fff',
                                }}
                                onClick={() => handleOpenAnalysisModal(q)}
                                title="Lihat hasil pengerjaan siswa & koreksi nilai"
                              >
                                <span>📊 Nilai</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer / Pagination Controls */}
            <div className="tableFooter">
              <div className="entriesSelector">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={() => {}}
                  className="entriesSelect"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="paginationControls">
                <button
                  className="pageBtnNav"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pageBtnNum ${pageNum === safePage ? 'pageBtnActive' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  className="pageBtnNav"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Dedicated In-Page Workspace: Bank Soal & Butir Soal CBT (PG & Soal Bukan PG) ── */}
      {activeView === 'QUESTIONS' && viewQuestionsQuiz && (
        <div className={styles.tableCard} style={{ marginTop: '0.5rem', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
          {/* Body */}
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>Total Butir Soal</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{questionsList.length} Soal</div>
              </div>

              <div style={{ background: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 700 }}>Pilihan Ganda (PG)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{totalPgCount} Soal</div>
              </div>

              <div style={{ background: 'rgba(217, 119, 6, 0.06)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>Soal Uraian (Esai)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{totalEssayCount} Soal</div>
              </div>

              <div style={{ background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.25)', padding: '0.85rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>Total Bobot Nilai</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{totalCumulativePoints} Poin</div>
              </div>
            </div>

            {viewQuestionsQuiz.status === 'DRAFT' && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#1e40af' }}>
                  <strong>📢 Status Ujian: DRAFT.</strong> {questionsList.length > 0 ? `Kuis sudah memiliki ${questionsList.length} butir soal. Klik tombol "Publish Kuis" di samping agar kuis aktif dan dapat dikerjakan siswa di aplikasi Android.` : 'Silakan tambahkan butir soal di bawah terlebih dahulu, lalu klik Publish jika sudah siap.'}
                </div>
                {questionsList.length > 0 && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 800, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => setPublishingQuiz(viewQuestionsQuiz)}
                  >
                    <span>📢 Publish Kuis Sekarang</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Daftar Butir Soal CBT ({questionsList.length} Soal)
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddQuestion(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                {showAddQuestion ? '✕ Tutup Form' : '+ Tambah Butir Soal Baru'}
              </button>
            </div>

              {/* Form Tambah Butir Soal */}
              {showAddQuestion && (
                <form
                  onSubmit={handleAddQuestionSubmit}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                     Tambah Soal CBT Baru (#{questionsList.length + 1})
                  </div>

                  {/* Format Soal Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                      Format / Tipe Soal:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setNewQuestionType('MULTIPLE_CHOICE')}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: newQuestionType === 'MULTIPLE_CHOICE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: newQuestionType === 'MULTIPLE_CHOICE' ? '#eff6ff' : '#fff',
                          color: newQuestionType === 'MULTIPLE_CHOICE' ? '#1d4ed8' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        🔘 Pilihan Ganda (PG)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewQuestionType('ESSAY')}
                        style={{
                          flex: 1,
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: newQuestionType === 'ESSAY' ? '2px solid #d97706' : '1px solid #cbd5e1',
                          background: newQuestionType === 'ESSAY' ? '#fef3c7' : '#fff',
                          color: newQuestionType === 'ESSAY' ? '#b45309' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                         Soal Bukan PG (Esai / Uraian)
                      </button>
                    </div>
                  </div>

                  {/* Pertanyaan / Teks Soal */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                      Isi / Teks Pertanyaan:
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newQuestionText}
                      onChange={e => setNewQuestionText(e.target.value)}
                      placeholder={newQuestionType === 'MULTIPLE_CHOICE' ? 'Tuliskan pertanyaan pilihan ganda...' : 'Tuliskan instruksi atau pertanyaan soal uraian/esai yang harus dijawab siswa...'}
                      className="input"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  {/* Bobot Poin */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                      Bobot Poin Soal Ini:
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {[5, 10, 15, 20, 25].map(pts => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setNewQuestionPoints(pts)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: newQuestionPoints === pts ? '1px solid #2563eb' : '1px solid #cbd5e1',
                            background: newQuestionPoints === pts ? '#2563eb' : '#fff',
                            color: newQuestionPoints === pts ? '#fff' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {pts} Poin
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newQuestionPoints}
                        onChange={e => setNewQuestionPoints(Number(e.target.value))}
                        className="input"
                        style={{ width: '80px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>

                  {/* Opsi Pilihan Ganda */}
                  {newQuestionType === 'MULTIPLE_CHOICE' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                        Pilihan Jawaban &amp; Tandai Kunci Jawaban Benar (🔘):
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {newChoices.map((choice, idx) => {
                          const labelChar = String.fromCharCode(65 + idx); // A, B, C, D
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="radio"
                                name="correctChoice"
                                checked={choice.isCorrect}
                                onChange={() => {
                                  setNewChoices(prev => prev.map((c, i) => ({ ...c, isCorrect: i === idx })));
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                                title={`Pilih ${labelChar} sebagai jawaban benar`}
                              />
                              <span style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: choice.isCorrect ? '#16a34a' : '#e2e8f0',
                                color: choice.isCorrect ? '#fff' : '#475569',
                                fontWeight: 800,
                                fontSize: '0.75rem'
                              }}>
                                {labelChar}
                              </span>
                              <input
                                type="text"
                                required
                                value={choice.text}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewChoices(prev => prev.map((c, i) => i === idx ? { ...c, text: val } : c));
                                }}
                                placeholder={`Teks pilihan ${labelChar}...`}
                                className="input"
                                style={{
                                  flex: 1,
                                  borderColor: choice.isCorrect ? '#16a34a' : undefined,
                                  background: choice.isCorrect ? '#f0fdf4' : '#fff'
                                }}
                              />
                              {choice.isCorrect && (
                                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  ✓ Kunci Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Format Uraian / Bukan Pilihan Ganda */
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: '#92400e'
                    }}>
                      <div style={{ fontWeight: 800 }}>💡 Mode Soal Uraian / Bukan Pilihan Ganda:</div>
                      <div>
                        Siswa akan menjawab soal ini secara deskriptif / uraian teks di <strong>Aplikasi Android CBT Siswa</strong>.
                        Hasil jawaban siswa akan masuk ke antrean koreksi guru untuk dinilai secara objektif sesuai rubrik.
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddQuestion(false)}
                      disabled={savingQuestion}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={savingQuestion}
                    >
                      {savingQuestion ? 'Menyimpan...' : '✓ Simpan Butir Soal'}
                    </button>
                  </div>
                </form>
              )}

              {/* Questions List */}
              {loadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Memuat butir soal...
                </div>
              ) : questionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    Belum Ada Butir Soal pada Kuis Ini
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '6px auto 14px' }}>
                    Guru dapat menginput soal langsung dari <strong>Portal Guru Android</strong> atau menggunakan tombol di bawah ini.
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddQuestion(true)}
                  >
                    + Tambah Butir Soal Sekarang
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questionsList.map((q, idx) => {
                    const isMultipleChoice = q.question_type.toUpperCase().includes('CHOICE') || q.question_type.toUpperCase() === 'PG';
                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Question Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              background: '#0f172a',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              padding: '0.2rem 0.55rem'
                            }}>
                              Soal #{q.order_index || idx + 1}
                            </span>
                            <span style={{
                              background: isMultipleChoice ? 'rgba(37, 99, 235, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                              color: isMultipleChoice ? '#2563eb' : '#d97706',
                              border: `1px solid ${isMultipleChoice ? 'rgba(37, 99, 235, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem'
                            }}>
                              {isMultipleChoice ? '🔘 Pilihan Ganda (PG)' : ' Soal Bukan PG (Esai / Uraian)'}
                            </span>
                          </div>

                          <div style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                          }}>
                            ⭐ {q.points} Poin
                          </div>
                        </div>

                        {/* Question Text */}
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {q.question_text}
                        </div>

                        {/* Choices or Essay Box */}
                        {isMultipleChoice ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
                            {(q.choices || []).map((c, cIdx) => {
                              const choiceLetter = String.fromCharCode(65 + (c.order_index ? c.order_index - 1 : cIdx));
                              const isCorrect = c.is_correct === true;
                              return (
                                <div
                                  key={c.id || cIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    border: isCorrect ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                                    background: isCorrect ? '#f0fdf4' : '#fff',
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
                                    background: isCorrect ? '#16a34a' : '#f1f5f9',
                                    color: isCorrect ? '#fff' : '#64748b',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    flexShrink: 0,
                                  }}>
                                    {choiceLetter}
                                  </span>
                                  <span style={{ flex: 1, fontWeight: isCorrect ? 700 : 500, color: isCorrect ? '#15803d' : '#334155' }}>
                                    {c.choice_text}
                                  </span>
                                  {isCorrect && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                      ✓ Kunci
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{
                            background: '#fefce8',
                            border: '1px solid #fef08a',
                            borderRadius: '8px',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.78rem',
                            color: '#854d0e',
                          }}>
                            <span></span>
                            <div>
                              <strong>Format Jawaban Terbuka (Uraian):</strong> Siswa mengetikkan uraian jawaban di portal Android CBT. Hasil dinilai secara manual oleh Guru pengampu.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.875rem 1.5rem',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-elevated)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg> Tersinkronisasi Otomatis dengan Aplikasi Android Guru &amp; Siswa
              </div>
              
            </div>
          </div>
      )}

      {/* ── Modal Input Kuis CBT Baru ── */}
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
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Buat &amp; Publish Kuis CBT Baru</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ujian online real-time untuk aplikasi Android siswa</div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateQuiz} style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Judul Kuis / Ujian CBT: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penilaian Harian Sains Bab 2"
                  value={newQuiz.title}
                  onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Mata Pelajaran:
                  </label>
                  <select
                    value={newQuiz.subject}
                    onChange={e => setNewQuiz({ ...newQuiz, subject: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    {subjectsList.length > 0 ? (
                      subjectsList.map((s: SubjectItem) => (
                        <option key={s.id || s.name} value={s.name}>{s.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Ilmu Pengetahuan Alam dan Sosial (IPAS)">Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>
                        <option value="Matematika (Umum)">Matematika (Umum)</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                        <option value="Pendidikan Agama Islam">Pendidikan Agama Islam</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Rombel Sasaran:
                  </label>
                  <select
                    value={newQuiz.classRoom}
                    onChange={e => setNewQuiz({ ...newQuiz, classRoom: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    {classesList.length > 0 ? (
                      classesList.map((c: ClassItem) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">Belum ada rombel</option>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Guru Pembuat / Pengawas:
                  </label>
                  {isTeacher && user?.full_name ? (
                    <input
                      type="text"
                      disabled
                      value={user.full_name}
                      className="input"
                      style={{ width: '100%', background: 'var(--bg-elevated)', cursor: 'not-allowed', fontWeight: 700 }}
                    />
                  ) : (
                    <select
                      value={newQuiz.teacherName}
                      onChange={e => setNewQuiz({ ...newQuiz, teacherName: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      {teachers.length > 0 ? (
                        teachers.map((t: TeacherItem) => (
                          <option key={t.id} value={t.full_name}>{t.full_name}</option>
                        ))
                      ) : (
                        <option value="">Belum ada guru</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Durasi Waktu Ujian:
                  </label>
                  <select
                    value={newQuiz.duration}
                    onChange={e => setNewQuiz({ ...newQuiz, duration: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="15 Menit">15 Menit</option>
                    <option value="30 Menit">30 Menit</option>
                    <option value="45 Menit">45 Menit</option>
                    <option value="60 Menit">60 Menit</option>
                    <option value="90 Menit">90 Menit</option>
                  </select>
                </div>
              </div>

              {/* Jadwal Pelaksanaan Ujian (Tanggal & Jam) */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📅</span> Jadwal Pelaksanaan Ujian (Tanggal &amp; Waktu)
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    Tanggal Pelaksanaan Ujian:
                  </label>
                  <input
                    type="date"
                    value={newQuiz.startDate}
                    onChange={e => setNewQuiz({ ...newQuiz, startDate: e.target.value, endDate: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                      Jam Awal / Mulai (WIB):
                    </label>
                    <input
                      type="time"
                      value={newQuiz.startTime}
                      onChange={e => setNewQuiz({ ...newQuiz, startTime: e.target.value })}
                      className="input"
                      style={{ width: '100%', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                      Jam Akhir / Selesai (WIB):
                    </label>
                    <input
                      type="time"
                      value={newQuiz.endTime}
                      onChange={e => setNewQuiz({ ...newQuiz, endTime: e.target.value })}
                      className="input"
                      style={{ width: '100%', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Deskripsi / Petunjuk Pengerjaan:
                </label>
                <textarea
                  rows={2}
                  placeholder="Petunjuk khusus ujian CBT..."
                  value={newQuiz.description}
                  onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ℹ️ Setelah kuis dibuat, status awal adalah <strong>Draft</strong>. Anda dapat langsung menambahkan butir soal pilihan ganda maupun esai melalui menu <strong>Butir Soal</strong>, lalu klik <strong>Publish</strong> untuk mengaktifkan ke siswa.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">💾 Simpan Kuis Baru (Draft)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Atur Jadwal Pelaksanaan CBT ── */}
      {scheduleQuiz && (
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
        }} onClick={() => !isSavingSchedule && setScheduleQuiz(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>📅 Atur Jadwal Pelaksanaan CBT</h2>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tentukan tanggal, jam awal, dan jam akhir ujian</div>
              </div>
              <button onClick={() => !isSavingSchedule && setScheduleQuiz(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSchedule} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{scheduleQuiz.title}</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  {scheduleQuiz.subject} • Rombel: {scheduleQuiz.classRoom} • Guru: {scheduleQuiz.teacherName}
                </div>
              </div>

              {/* Tanggal Pelaksanaan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Tanggal Pelaksanaan Ujian (Tanggal / Bulan / Tahun): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.startDate}
                  onChange={e => setScheduleForm({ ...scheduleForm, startDate: e.target.value, endDate: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontWeight: 700 }}
                />
              </div>

              {/* Jam Mulai & Jam Selesai */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Jam Awal / Mulai (WIB): <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Jam Akhir / Selesai (WIB): <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Durasi Pengerjaan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Durasi Pengerjaan Siswa (Menit):
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {[30, 45, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, durationMinutes: mins })}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        border: scheduleForm.durationMinutes === mins ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: scheduleForm.durationMinutes === mins ? '#eff6ff' : '#fff',
                        color: scheduleForm.durationMinutes === mins ? '#1d4ed8' : '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {mins} Mnt
                    </button>
                  ))}
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={scheduleForm.durationMinutes}
                    onChange={e => setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })}
                    className="input"
                    style={{ width: '75px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                ℹ️ Jadwal tanggal dan jam ini akan ditampilkan di portal CBT guru dan aplikasi Android siswa.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setScheduleQuiz(null)}
                  disabled={isSavingSchedule}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingSchedule}
                >
                  {isSavingSchedule ? 'Menyimpan...' : '💾 Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Publish Ujian Online CBT ── */}
      {publishingQuiz && (
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
        }} onClick={() => !isPublishing && setPublishingQuiz(null)}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>📢 Publish Ujian Online (CBT)</h2>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Menerbitkan kuis ke aplikasi Android siswa</div>
              </div>
              <button onClick={() => !isPublishing && setPublishingQuiz(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Quiz details summary */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{publishingQuiz.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  {publishingQuiz.subject} • Rombel: {publishingQuiz.classRoom} • Guru: {publishingQuiz.teacherName}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1' }}>
                    ⏱️ Durasi: {publishingQuiz.duration}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: publishingQuiz.totalQuestions > 0 ? '#dcfce7' : '#fee2e2', color: publishingQuiz.totalQuestions > 0 ? '#15803d' : '#b91c1c' }}>
                    📝 {publishingQuiz.totalQuestions} Butir Soal
                  </span>
                  {publishingQuiz.startAt ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#f3e8ff', color: '#7e22ce' }}>
                      📅 {formatScheduleIndo(publishingQuiz.startAt, publishingQuiz.endAt)?.dateStr} ({formatScheduleIndo(publishingQuiz.startAt, publishingQuiz.endAt)?.timeStr})
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309' }}>
                      ⚠️ Belum ada jadwal waktu
                    </span>
                  )}
                </div>
              </div>

              {/* Validation or Ready */}
              {publishingQuiz.totalQuestions === 0 ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem', color: '#991b1b', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>⚠️ Kuis Masih Kosong (0 Soal)</div>
                  Kuis ini belum memiliki butir soal. Sistem CBT mewajibkan minimal 1 butir soal sebelum kuis dapat dipublish agar siswa tidak mengerjakan ujian kosong.
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const target = publishingQuiz;
                        setPublishingQuiz(null);
                        handleOpenQuestionsModal(target);
                      }}
                    >
                      + Tambah Butir Soal Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', color: '#166534', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 800, marginBottom: '2px' }}>✓ Kuis Siap Dipublish!</div>
                    Semua <strong>{publishingQuiz.totalQuestions} butir soal</strong> sudah siap. Setelah dipublish:
                    <ul style={{ margin: '4px 0 0 1rem', padding: 0 }}>
                      <li>Status ujian berubah menjadi <strong>Active / Published</strong>.</li>
                      <li>Notifikasi otomatis terkirim ke portal &amp; HP siswa kelas <strong>{publishingQuiz.classRoom}</strong>.</li>
                      <li>Siswa dapat langsung mengerjakan ujian CBT sesuai jadwal yang ditentukan.</li>
                    </ul>
                  </div>

                  {!publishingQuiz.startAt && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#92400e' }}>
                      💡 <strong>Tips:</strong> Anda belum mengatur tanggal &amp; jam ujian. Anda dapat tetap mempublishnya sekarang atau klik tombol <strong>Atur Jadwal</strong> di bawah.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPublishingQuiz(null)}
                  disabled={isPublishing}
                >
                  Batal
                </button>
                {!publishingQuiz.startAt && publishingQuiz.totalQuestions > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const target = publishingQuiz;
                      setPublishingQuiz(null);
                      handleOpenScheduleModal(target);
                    }}
                    disabled={isPublishing}
                  >
                    📅 Atur Jadwal Dulu
                  </button>
                )}
                {publishingQuiz.totalQuestions > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 800 }}
                    onClick={() => handlePublishQuiz(publishingQuiz)}
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Mempublish...' : '📢 Ya, Publish Kuis Sekarang'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dedicated In-Page Workspace: Analisis Nilai CBT & Koreksi Siswa ── */}
      {activeView === 'ANALYSIS' && analyzedQuiz && (
        <div className={styles.tableCard} style={{ marginTop: '0.5rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* KPI Cards */}
          {(() => {
            const totalParticipants = cbtScores.length;
            const completedScores = cbtScores.filter(s => s.status !== 'Sedang Mengerjakan');
            const avgScore = completedScores.length > 0 
              ? Math.round(completedScores.reduce((acc, s) => acc + s.score, 0) / completedScores.length) 
              : 0;
            const passedCount = cbtScores.filter(s => s.status === 'Lulus KKM').length;
            const passRate = completedScores.length > 0 
              ? Math.round((passedCount / completedScores.length) * 100) 
              : 0;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>Total Peserta Ujian</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{totalParticipants} Siswa</div>
                </div>

                <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>Nilai Rata-Rata Kelas</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                    {completedScores.length > 0 ? `${avgScore}` : '-'}
                  </div>
                </div>

                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>Kelulusan KKM (75)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>
                    {completedScores.length > 0 ? `${passRate}% (${passedCount}/${completedScores.length})` : '-'}
                  </div>
                </div>
              </div>
            );
          })()}

          {analysisError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
              ⚠️ {analysisError}
            </div>
          )}

          {/* Scores Table */}
          {loadingAnalysis ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></div>
              <div>Memuat data riwayat dan hasil ujian CBT siswa dari server...</div>
            </div>
          ) : cbtScores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Belum Ada Siswa yang Mengerjakan Ujian CBT Ini
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '6px auto 0' }}>
                Siswa dapat mengakses dan mengerjakan kuis ini via aplikasi <strong>School OS Android</strong>. Hasil ujian dan nilai otomatis langsung tersinkronkan di halaman ini.
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span> Daftar Nilai CBT Siswa ({cbtScores.length} Siswa)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Klik tombol  Periksa untuk melihat rincian butir jawaban siswa</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.875rem' }}>Nama Siswa (NISN)</th>
                    <th style={{ padding: '0.6rem 0.875rem' }}>Durasi</th>
                    <th style={{ padding: '0.6rem 0.875rem' }}>Jawaban Benar</th>
                    <th style={{ padding: '0.6rem 0.875rem' }}>Skor CBT</th>
                    <th style={{ padding: '0.6rem 0.875rem' }}>Status KKM</th>
                    <th style={{ padding: '0.6rem 0.875rem', textAlign: 'right' }}>Aksi &amp; Koreksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cbtScores.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: inspectingAttempt?.attemptId === s.id ? '#f0f9ff' : undefined }}>
                      <td style={{ padding: '0.6rem 0.875rem' }}>
                        <strong>{s.studentName}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.nisn}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)' }}> {s.timeSpent}</td>
                      <td style={{ padding: '0.6rem 0.875rem', fontWeight: 700 }}>{s.correctAnswers} / {s.totalQuestions}</td>
                      <td style={{ padding: '0.6rem 0.875rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: s.score >= 75 ? '#16a34a' : '#dc2626' }}>{s.score}</strong> / 100
                      </td>
                      <td style={{ padding: '0.6rem 0.875rem' }}>
                        <span className={`badge ${s.status === 'Lulus KKM' ? 'badge-active' : s.status === 'Sedang Mengerjakan' ? 'badge-info' : 'badge-warning'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.875rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-sm"
                          style={{
                            fontWeight: 700,
                            background: inspectingAttempt?.attemptId === s.id ? '#2563eb' : 'rgba(37, 99, 235, 0.08)',
                            color: inspectingAttempt?.attemptId === s.id ? '#fff' : '#2563eb',
                            border: '1px solid #93c5fd',
                            borderRadius: '6px',
                            padding: '0.35rem 0.65rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleInspectStudentAttempt(s.id, s.studentName, s.nisn, s.score)}
                        >
                          {inspectingAttempt?.attemptId === s.id ? '✕ Tutup Lembar' : ' Periksa & Koreksi'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Loading Attempt Spinner */}
          {loadingAttemptDetail && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600 }}>
               Memuat lembar jawaban dan data butir soal siswa...
            </div>
          )}

          {/* Dedicated In-Page Student Attempt Inspection & Grading Panel */}
          {inspectingAttempt && !loadingAttemptDetail && (
            <div style={{
              background: 'var(--bg-card)',
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span></span> Lembar Jawaban: {inspectingAttempt.studentName} ({inspectingAttempt.studentNisn})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Skor Saat Ini: <strong>{inspectingAttempt.score}/100</strong> • Periksa kebenaran jawaban pilihan ganda atau beri nilai &amp; ulasan untuk soal esai di bawah.
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectingAttempt(null)}
                >
                  ✕ Tutup Lembar
                </button>
              </div>

              {/* Answers list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {inspectingAttempt.answers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Tidak ada rekaman butir jawaban untuk pengerjaan kuis ini.
                  </div>
                ) : (
                  inspectingAttempt.answers.map((ans, idx) => {
                    const isPg = Boolean(ans.chosen_choice_text || (!ans.text_answer && ans.chosen_choice_id));
                    return (
                      <div key={ans.question_id || idx} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Soal #{idx + 1}</span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: isPg ? (ans.is_correct ? '#dcfce7' : '#fee2e2') : '#fef3c7',
                            color: isPg ? (ans.is_correct ? '#166534' : '#991b1b') : '#92400e',
                          }}>
                            {isPg ? (ans.is_correct ? '✓ Pilihan Ganda (Benar)' : '✗ Pilihan Ganda (Salah)') : ' Soal Uraian / Bukan PG'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {ans.question_text || `Pertanyaan Butir #${idx + 1}`}
                        </div>

                        {isPg ? (
                          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                            <span style={{ color: '#64748b' }}>Jawaban yang dipilih siswa: </span>
                            <strong style={{ color: ans.is_correct ? '#15803d' : '#b91c1c' }}>
                              {ans.chosen_choice_text || '(Tidak memilih jawaban)'}
                            </strong>
                            <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                              Poin otomatis: <strong>{ans.points_earned}</strong> / {ans.max_points || 25}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ background: '#fffbeb', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.84rem' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>Jawaban Teks Siswa:</div>
                              <div style={{ whiteSpace: 'pre-wrap', color: '#78350f', fontStyle: ans.text_answer ? 'normal' : 'italic' }}>
                                {ans.text_answer || '(Siswa tidak mengisi jawaban teks)'}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  Poin Nilai (Maks: {ans.max_points || 25}):
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={ans.max_points || 100}
                                  value={gradingScores[ans.question_id] ?? ans.points_earned ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setGradingScores(prev => ({ ...prev, [ans.question_id]: val }));
                                  }}
                                  className="input"
                                  style={{ width: '100%', fontWeight: 700 }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  Komentar / Feedback Koreksi:
                                </label>
                                <input
                                  type="text"
                                  placeholder="Misal: Penjelasan cukup lengkap, perhatikan perumusan..."
                                  value={gradingFeedbacks[ans.question_id] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setGradingFeedbacks(prev => ({ ...prev, [ans.question_id]: val }));
                                  }}
                                  className="input"
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Grading Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectingAttempt(null)}
                  disabled={isSavingGrade}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSaveGrade(inspectingAttempt.attemptId)}
                  disabled={isSavingGrade}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {isSavingGrade ? ' Menyimpan & Sinkronkan...' : '💾 Simpan Koreksi & Sinkronkan Nilai'}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '0.875rem 0 0', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg> Nilai dan koreksi guru otomatis terkirim dan tersinkronkan ke HP Siswa
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setActiveView('LIST');
                setAnalyzedQuiz(null);
                setInspectingAttempt(null);
              }}
            >
              ← Kembali ke Daftar Kuis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
