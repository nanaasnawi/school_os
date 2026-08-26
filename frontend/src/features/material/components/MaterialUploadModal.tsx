'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { materialFormSchema, MaterialFormValues } from '../schemas/material-schema';
import { useCreateMaterial } from '../mutations/use-create-material';
import { Button } from '@/shared/ui/button';
import { X, FileText, Video, Link2, Music } from 'lucide-react';

export interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export function MaterialUploadModal({ isOpen, onClose, defaultSubjectId = '00000000-0000-0000-0000-000000000001' }: MaterialUploadModalProps) {
  const createMaterial = useCreateMaterial();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      subject_id: defaultSubjectId,
      title: '',
      content: '',
      file_url: '',
      material_type: 'pdf',
    },
  });

  const selectedType = watch('material_type');

  if (!isOpen) return null;

  const onSubmit = (data: MaterialFormValues) => {
    createMaterial.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const typeIcons = [
    { type: 'pdf', label: 'Dokumen PDF', icon: <FileText className="w-4 h-4" /> },
    { type: 'video', label: 'Video Pembelajaran', icon: <Video className="w-4 h-4" /> },
    { type: 'link', label: 'Tautan / URL', icon: <Link2 className="w-4 h-4" /> },
    { type: 'document', label: 'Dokumen Teks', icon: <FileText className="w-4 h-4" /> },
    { type: 'audio', label: 'Audio Podcast', icon: <Music className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Unggah Materi Pembelajaran Baru</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Materi</label>
            <input
              {...register('title')}
              placeholder="Contoh: Pengenalan Fisika Kuantum Dasar"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipe Materi</label>
            <div className="grid grid-cols-3 gap-2">
              {typeIcons.map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setValue('material_type', item.type as MaterialFormValues['material_type'])}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedType === item.type
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL File / Tautan Materi</label>
            <input
              {...register('file_url')}
              placeholder="https://storage.schoolos.id/materials/fisika-101.pdf"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            {errors.file_url && <p className="text-xs text-rose-400 mt-1">{errors.file_url.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ringkasan / Catatan Materi</label>
            <textarea
              {...register('content')}
              rows={3}
              placeholder="Tambahkan catatan atau petunjuk membaca untuk siswa..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMaterial.isPending}>
              Simpan Materi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
