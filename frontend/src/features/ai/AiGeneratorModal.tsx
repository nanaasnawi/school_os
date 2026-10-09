'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, AlertCircle } from 'lucide-react';
import { getApiUrl, apiClient } from '@/lib/api';
import { resolveSafeImageUrl } from '@/features/material';
import styles from './AiGeneratorModal.module.css';

export type AiGeneratorMode = 'INFOGRAPHIC' | 'ARTICLE' | 'ASSIGNMENT' | 'QUIZ';

export interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AiGeneratorMode;
  initialTopic?: string;
  initialSubject?: string;
  initialGrade?: string;
  onGenerated: (data: any) => void;
}

const MODE_LABELS: Record<AiGeneratorMode, { title: string; subtitle: string; placeholder: string }> = {
  INFOGRAPHIC: {
    title: 'Generate Infografis Interaktif',
    subtitle: 'Menyusun rangkaian kartu konsep visual & ringkasan materi otomatis.',
    placeholder: 'Contoh: Siklus Air dan Presipitasi Hujan',
  },
  ARTICLE: {
    title: 'Generate Naskah Artikel & Modul',
    subtitle: 'Menuliskan artikel materi lengkap terstruktur dalam format Markdown.',
    placeholder: 'Contoh: Ekosistem Hutan Hujan dan Rantai Makanan',
  },
  ASSIGNMENT: {
    title: 'Generate Lembar Tugas Siswa',
    subtitle: 'Menyusun petunjuk penugasan langkah demi langkah beserta rubrik.',
    placeholder: 'Contoh: Praktik Pengamatan Perkecambahan Biji Kacang Hijau',
  },
  QUIZ: {
    title: 'Generate Soal Kuis & Ujian CBT',
    subtitle: 'Menghasilkan bank butir soal pilihan ganda, kunci jawaban & pembahasan.',
    placeholder: 'Contoh: Operasi Pecahan Biasa dan Campuran',
  },
};

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTopic = '',
  initialSubject = 'IPA',
  initialGrade = 'Kelas 5 SD',
  onGenerated,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [subjectName, setSubjectName] = useState(initialSubject);
  const [gradeLevel, setGradeLevel] = useState(initialGrade);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'HOTS'>('Sedang');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const modeInfo = MODE_LABELS[mode];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Silakan masukkan topik materi terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = apiClient.getToken();
      const endpoint = getApiUrl('/api/v1/ai/generate-content');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode,
          topic: topic.trim(),
          subject_name: subjectName.trim(),
          grade_level: gradeLevel.trim(),
          num_questions: numQuestions,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Gagal memproses dengan AI NVIDIA di backend.');
      }

      const content = result.data;
      let generatedData = null;
      if (mode === 'INFOGRAPHIC') {
        const rawInfo = content?.infographic || content;
        if (rawInfo && Array.isArray(rawInfo.blocks)) {
          const topicHint = topic.trim();
          let blocks = rawInfo.blocks.map((b: any, idx: number) => {
            const rawType = (b.type || b.block_type || 'TEXT').toUpperCase();
            const type = rawType === 'IMAGE' ? 'IMAGE' : 'TEXT';
            let blkContent = (b.content || '').trim();

            if (type === 'IMAGE') {
              blkContent = resolveSafeImageUrl(blkContent, idx, topicHint);
            }

            return {
              id: b.id || `ai-block-${idx + 1}-${Date.now()}`,
              type,
              content: blkContent,
            };
          });

          // Ensure hero cover exists at block 0
          if (blocks.length > 0 && blocks[0].type !== 'IMAGE') {
            const coverUrl = resolveSafeImageUrl('', 0, topicHint);
            blocks.unshift({
              id: `hero-cover-${Date.now()}`,
              type: 'IMAGE',
              content: coverUrl,
            });
          }

          generatedData = {
            ...rawInfo,
            blocks,
          };
        } else {
          generatedData = rawInfo;
        }
      } else if (mode === 'ARTICLE') {
        generatedData = {
          ...content?.article,
          articleContent: content?.article?.article_content,
        };
      } else if (mode === 'ASSIGNMENT') {
        generatedData = content?.assignment;
      } else if (mode === 'QUIZ') {
        generatedData = content?.quiz;
      }

      onGenerated(generatedData || content);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => !isLoading && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Sparkles size={18} />
            </div>
            <div className={styles.titleGroup}>
              <h3 className={styles.title}>
                <span>{modeInfo.title}</span>
                <span className={styles.badge}>NVIDIA NIM</span>
              </h3>
              <p className={styles.subtitle}>{modeInfo.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate}>
          <div className={styles.body}>
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4448',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Topik / Judul Materi Pembelajaran <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={modeInfo.placeholder}
                disabled={isLoading}
                required
                autoFocus
              />
              <span className={styles.hint}>
                Ketikkan kata kunci materi spesifik agar AI menyusun konten yang tepat sasaran.
              </span>
            </div>

            <div className={styles.rowGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Mata Pelajaran</label>
                <input
                  type="text"
                  className={styles.input}
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Misal: Matematika, IPA"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Jenjang / Kelas</label>
                <input
                  type="text"
                  className={styles.input}
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="Misal: Kelas 5 SD, Kelas 8 SMP"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode === 'QUIZ' && (
              <div className={styles.rowGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Jumlah Butir Soal</label>
                  <select
                    className={styles.select}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    disabled={isLoading}
                  >
                    <option value={3}>3 Butir Soal (Kuis Singkat)</option>
                    <option value={5}>5 Butir Soal (Standar)</option>
                    <option value={10}>10 Butir Soal (Ujian Harian)</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Tingkat Kesulitan</label>
                  <select
                    className={styles.select}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    disabled={isLoading}
                  >
                    <option value="Mudah">Mudah (Pemahaman Dasar C1-C2)</option>
                    <option value="Sedang">Sedang (Aplikasi Konsep C3)</option>
                    <option value="HOTS">HOTS (Analisis Tinggi C4-C5)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.btnGenerate}
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Meracik dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Mulai Generate Konten</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
