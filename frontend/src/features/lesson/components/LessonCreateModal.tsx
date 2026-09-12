'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonFormSchema, LessonFormValues } from '../schemas/lesson-schema';
import { useCreateLesson } from '../mutations/use-create-lesson';
import { useMaterials } from '@/features/material/queries/use-materials';
import { Button } from '@/shared/ui/button';
import { X, BookOpen, Check } from 'lucide-react';

export interface LessonCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSyllabusId?: string;
}

export function LessonCreateModal({
  isOpen,
  onClose,
  defaultSyllabusId = '00000000-0000-0000-0000-000000000001',
}: LessonCreateModalProps) {
  const createLesson = useCreateLesson();
  const { data: materials = [] } = useMaterials();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      syllabus_id: defaultSyllabusId,
      title: '',
      summary: '',
      order_index: 1,
      material_ids: [],
    },
  });

  const selectedMaterialIds = watch('material_ids') || [];

  if (!isOpen) return null;

  const toggleMaterial = (id: string) => {
    if (selectedMaterialIds.includes(id)) {
      setValue(
        'material_ids',
        selectedMaterialIds.filter((mId) => mId !== id)
      );
    } else {
      setValue('material_ids', [...selectedMaterialIds, id]);
    }
  };

  const onSubmit = (data: LessonFormValues) => {
    createLesson.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Buat Modul Pembelajaran Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Modul Pembelajaran</label>
            <input
              {...register('title')}
              placeholder="Contoh: Modul 1: Hukum Newton dan Penerapannya"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Urutan Modul</label>
              <input
                type="number"
                {...register('order_index', { valueAsNumber: true })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {errors.order_index && <p className="text-xs text-rose-400 mt-1">{errors.order_index.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Awal</label>
              <input
                disabled
                value="Draft (Siap Publikasi)"
                className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ringkasan Modul</label>
            <textarea
              {...register('summary')}
              rows={2}
              placeholder="Jelaskan tujuan pembelajaran modul ini..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lampirkan Materi Pembelajaran (Minimal 1)
            </label>
            {materials.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                Belum ada materi pembelajaran. Silakan unggah materi di Learning Workspace terlebih dahulu.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {materials.map((mat: Record<string, unknown>) => {
                  const matId = String(mat.id);
                  const isSelected = selectedMaterialIds.includes(matId);
                  return (
                    <div
                      key={matId}
                      onClick={() => toggleMaterial(matId)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{String(mat.title)}</p>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{String(mat.material_type)}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.material_ids && <p className="text-xs text-rose-400 mt-1">{errors.material_ids.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" isLoading={createLesson.isPending}>
              Simpan Sebagai Draft
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
