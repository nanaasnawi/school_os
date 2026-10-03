'use client';

import React, { useState, useRef } from 'react';
import {
  ParsedScheduleRow,
  parseExcelSchedule,
  parsePdfSchedule,
  downloadScheduleExcelTemplate,
} from '@/lib/scheduleImport';

interface ScheduleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: any[];
  classes: any[];
  subjects: any[];
  onImportSuccess: (importedCount: number) => void;
  showToast: (msg: string) => void;
}

export default function ScheduleImportModal({
  isOpen,
  onClose,
  teachers,
  classes,
  subjects,
  onImportSuccess,
  showToast,
}: ScheduleImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedScheduleRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsParsing(true);
    setParseError(null);
    setRows([]);
    setSelectedRowIds([]);

    try {
      const fileName = selected.name.toLowerCase();
      let parsed: ParsedScheduleRow[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const buffer = await selected.arrayBuffer();
        parsed = parseExcelSchedule(buffer, teachers, subjects, classes);
      } else if (fileName.endsWith('.pdf')) {
        parsed = await parsePdfSchedule(selected, teachers, subjects, classes);
      } else {
        throw new Error('Format file tidak didukung. Harap unggah berkas .xlsx, .xls, .csv, atau .pdf.');
      }

      if (parsed.length === 0) {
        setParseError('Tidak ada jadwal yang terdeteksi dari berkas tersebut. Pastikan kolom sesuai format template.');
      } else {
        setRows(parsed);
        // Select all valid rows by default
        const validIds = parsed.filter(r => r.isValid).map(r => r.rawId);
        setSelectedRowIds(validIds);
      }
    } catch (err: any) {
      console.error('Parse error:', err);
      setParseError(err.message || 'Gagal memproses berkas');
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleRow = (rawId: string) => {
    setSelectedRowIds(prev =>
      prev.includes(rawId) ? prev.filter(id => id !== rawId) : [...prev, rawId]
    );
  };

  const handleSelectAllValid = () => {
    const validIds = rows.filter(r => r.isValid).map(r => r.rawId);
    setSelectedRowIds(validIds);
  };

  const handleDeselectAll = () => {
    setSelectedRowIds([]);
  };

  const handleDeleteRow = (rawId: string) => {
    setRows(prev => prev.filter(r => r.rawId !== rawId));
    setSelectedRowIds(prev => prev.filter(id => id !== rawId));
  };

  const handleExecuteImport = async () => {
    const rowsToImport = rows.filter(r => selectedRowIds.includes(r.rawId) && r.isValid);
    if (rowsToImport.length === 0) {
      showToast('⚠️ Tidak ada jadwal valid yang dipilih untuk diimpor');
      return;
    }

    setIsSaving(true);
    setSaveProgress({ current: 0, total: rowsToImport.length });

    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('auth_token') || localStorage.getItem('token'))
      : null;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowsToImport.length; i++) {
      const item = rowsToImport[i];
      setSaveProgress({ current: i + 1, total: rowsToImport.length });

      try {
        const res = await fetch('/api/v1/academic/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            class_ids: item.matchedClassIds,
            subject_id: item.matchedSubjectId,
            teacher_id: item.matchedTeacherId,
            day_of_week: item.day,
            start_time: item.timeStart,
            end_time: item.timeEnd,
            room: item.roomInput || 'Ruang Kelas',
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    setIsSaving(false);
    setSaveProgress(null);

    if (successCount > 0) {
      onImportSuccess(successCount);
      showToast(`✓ Berhasil mengimpor ${successCount} jadwal pelajaran ke rombel!`);
      onClose();
    } else {
      showToast(`⚠️ Gagal mengimpor jadwal. Terdapat ${failCount} kegagalan koneksi.`);
    }
  };

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📥</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Import &amp; Pemetaan Jadwal Pelajaran (Excel / PDF)
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#c7d2fe' }}>
              Unggah file Excel (.xlsx / .csv) atau dokumen PDF jadwal sekolah. Sistem otomatis mencocokkan Guru, Rombel, &amp; Mata Pelajaran.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Action Bar: Download Template & Instructions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: '#f8fafc',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                  Belum punya format file jadwal?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Unduh template Excel resmi yang sudah otomatis memuat data Rombel, Guru, dan Matpel aktif sekolah.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadScheduleExcelTemplate(teachers, classes, subjects)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
              }}
            >
              <span>📥 Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #94a3b8',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#fafafa',
              transition: 'all 0.2s ease',
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const f = e.dataTransfer.files[0];
                const dt = new DataTransfer();
                dt.items.add(f);
                if (fileInputRef.current) {
                  fileInputRef.current.files = dt.files;
                  handleFileChange({ target: { files: dt.files } } as any);
                }
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
              {file ? `Berkas: ${file.name}` : 'Klik atau Seret Berkas Jadwal ke Sini'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
              Mendukung file Excel (<strong>.xlsx, .xls, .csv</strong>) atau Dokumen PDF (<strong>.pdf</strong>)
            </div>
          </div>

          {/* Parsing State */}
          {isParsing && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#4338ca', fontWeight: 700, fontSize: '0.88rem' }}>
              ⏳ Sedang memproses dan memetakan data jadwal...
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem' }}>
              ⚠️ {parseError}
            </div>
          )}

          {/* Preview Table */}
          {rows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Summary Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 800, color: '#1e293b' }}>Hasil Parsing: {rows.length} Baris</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
                    ✓ {validCount} Siap Impor
                  </span>
                  {invalidCount > 0 && (
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
                      ⚠️ {invalidCount} Tidak Lengkap / Error
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllValid}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Pilih Semua Valid
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.5rem', width: '36px', textAlign: 'center' }}>Pilih</th>
                      <th style={{ padding: '0.5rem' }}>Hari &amp; Jam</th>
                      <th style={{ padding: '0.5rem' }}>Mata Pelajaran</th>
                      <th style={{ padding: '0.5rem' }}>Guru Pengampu</th>
                      <th style={{ padding: '0.5rem' }}>Rombel Terpetakan</th>
                      <th style={{ padding: '0.5rem' }}>Ruang</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                      <th style={{ padding: '0.5rem', width: '36px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const isSelected = selectedRowIds.includes(r.rawId);
                      return (
                        <tr
                          key={r.rawId}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: !r.isValid ? '#fff5f5' : isSelected ? '#f0fdf4' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!r.isValid}
                              onChange={() => handleToggleRow(r.rawId)}
                            />
                          </td>
                          <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                            <strong>{r.day}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {r.timeStart} - {r.timeEnd}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            {r.matchedSubjectName ? (
                              <span style={{ fontWeight: 700, color: '#166534' }}>
                                {r.matchedSubjectName}
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626' }}>{r.subjectInput || 'Tidak Ada'}</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            {r.matchedTeacherName ? (
                              <span style={{ fontWeight: 700, color: '#1e40af' }}>
                                {r.matchedTeacherName}
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626' }}>{r.teacherInput || 'Tidak Ada'}</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            {r.matchedClassNames.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {r.matchedClassNames.map((cName, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      background: '#dbeafe',
                                      color: '#1e40af',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {cName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#dc2626', fontSize: '0.72rem' }}>
                                ⚠️ Rombel tidak cocok: {r.rombelInput}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem', color: '#64748b' }}>{r.roomInput}</td>
                          <td style={{ padding: '0.5rem' }}>
                            {r.isValid ? (
                              <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.72rem' }}>✓ Valid</span>
                            ) : (
                              <div style={{ color: '#dc2626', fontSize: '0.7rem' }}>
                                {r.errors.map((err, idx) => (
                                  <div key={idx}>• {err}</div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(r.rawId)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                              title="Hapus baris ini"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar when Saving */}
          {isSaving && saveProgress && (
            <div style={{ padding: '0.875rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.4rem' }}>
                <span>Menyimpan jadwal pelajaran ke server...</span>
                <span>{saveProgress.current} dari {saveProgress.total}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#dbeafe', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#2563eb',
                    width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {selectedRowIds.length > 0 ? (
              <span><strong>{selectedRowIds.length}</strong> jadwal dipilih untuk diimpor.</span>
            ) : (
              <span>Pilih baris jadwal yang valid untuk melanjutkan.</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isSaving || selectedRowIds.length === 0}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedRowIds.length === 0 || isSaving ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: selectedRowIds.length === 0 || isSaving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              }}
            >
              <span>{isSaving ? 'Menyimpan...' : `🚀 Terapkan & Simpan (${selectedRowIds.length}) Jadwal`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
