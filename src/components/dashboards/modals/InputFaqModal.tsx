import React, { useState, useEffect } from 'react';
import { HelpCircle, Save, Plus, Edit2, Trash2, RotateCcw, List, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getFaqList,
  saveFaqList,
  upsertFaqItem,
  deleteFaqItem,
  resetFaqToDefault,
  FaqItem,
} from '../../../services/faqSettingsService';

interface InputFaqModalProps {
  show: boolean;
  darkMode?: boolean;
  onClose: () => void;
  onSuccess?: (faq: { question: string; answer: string; category: string }) => void;
}



export default function InputFaqModal({ show, darkMode, onClose, onSuccess }: InputFaqModalProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>(() => getFaqList());
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Umum');

  useEffect(() => {
    if (show) {
      setFaqs(getFaqList());
      setViewMode('list');
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setAnswer('');
    setCategory('Umum');
  };

  const handleStartCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleStartEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setLabel(item.label);
    setAnswer(item.answer);
    setCategory(item.category || 'Umum');
    setViewMode('edit');
  };

  const handleDelete = (id: string, itemLabel: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus FAQ "${itemLabel}"?`)) {
      const updated = deleteFaqItem(id);
      setFaqs(updated);
      toast.success('FAQ berhasil dihapus!');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan daftar FAQ ke susunan default resmi BSMR?')) {
      const defaults = resetFaqToDefault();
      setFaqs(defaults);
      toast.success('FAQ berhasil di-reset ke default!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !answer.trim()) {
      toast.error('Pertanyaan FAQ dan Jawaban Resmi wajib diisi!');
      return;
    }

    const itemObj: FaqItem = {
      id: editingId || `faq-${Date.now()}`,
      label: label.trim(),
      icon: '',
      answer: answer.trim(),
      category: category.trim(),
    };

    const updated = upsertFaqItem(itemObj);
    setFaqs(updated);

    if (onSuccess) {
      onSuccess({ question: itemObj.label, answer: itemObj.answer, category: itemObj.category || 'Umum' });
    }

    toast.success(viewMode === 'edit' ? 'Perubahan FAQ berhasil disimpan!' : 'FAQ baru berhasil ditambahkan!');
    resetForm();
    setViewMode('list');
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-xl max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              {viewMode === 'list' ? 'Manajemen FAQ & Pertanyaan Populer' : viewMode === 'edit' ? 'Edit FAQ Chatbot' : 'Tambah FAQ Baru'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {viewMode === 'list' 
              ? 'Kelola nama tombol pertanyaan cepat dan isi jawaban resmi pada widget AI Chatbot.'
              : 'Atur teks pertanyaan pada tombol widget serta respons jawaban resmi AI Chatbot.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Tab / View Controller */}
        <div className="flex items-center justify-between gap-2 border-b pb-2.5 pt-1 border-gray-100 dark:border-gray-700 shrink-0">
          {viewMode === 'list' ? (
            <>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <List className="w-4 h-4" />
                <span>Total FAQ Aktif: <strong className="text-blue-600 dark:text-blue-400">{faqs.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefault}
                  className="h-8 text-xs gap-1 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Reset ke Default BSMR"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Default
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartCreate}
                  className="h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah FAQ
                </Button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('list');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Daftar FAQ
            </button>
          )}
        </div>

        {/* Modal Body */}
        {viewMode === 'list' ? (
          <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 min-h-[260px] max-h-[380px]">
            {faqs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2 border border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-600 dark:text-gray-300">Belum ada FAQ kustom</p>
                <Button size="sm" onClick={handleResetDefault} variant="outline" className="text-xs">
                  Pulihkan FAQ Bawaan
                </Button>
              </div>
            ) : (
              faqs.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    darkMode ? 'bg-gray-800/80 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.icon && item.icon.trim() !== '' && (
                        <span className="text-base shrink-0 p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40">
                          {item.icon}
                        </span>
                      )}
                      <span className="font-bold text-xs truncate text-gray-900 dark:text-gray-100">
                        {item.label}
                      </span>
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                        title="Edit FAQ & Jawaban"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.label)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        title="Hapus FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className={`text-[11px] leading-relaxed line-clamp-2 text-gray-600 dark:text-gray-400 ${item.icon && item.icon.trim() !== '' ? 'pl-8' : 'pl-1'}`}>
                    {item.answer}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 py-2 pr-1">
            {/* Pertanyaan FAQ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Nama Pertanyaan FAQ (Teks Tombol Widget) <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Jadwal & Lokasi Asesmen"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="text-xs h-9 font-medium w-full"
                required
              />
            </div>

            {/* Kategori FAQ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Kategori FAQ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full p-2 text-xs rounded-xl border outline-none transition-colors ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="Umum">Umum</option>
                <option value="Sertifikasi">Sertifikasi</option>
                <option value="Pendaftaran">Pendaftaran</option>
                <option value="Jadwal">Jadwal & Pelaksanaan</option>
                <option value="Biaya & Administrasi">Biaya & Administrasi</option>
                <option value="Pemeliharaan (SKP)">Pemeliharaan (SKP)</option>
              </select>
            </div>

            {/* Jawaban Resmi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Jawaban Resmi AI Chatbot <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Ketikkan jawaban resmi BSMR yang akan ditampilkan bot saat pertanyaan ini diklik..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                className={`w-full p-2.5 text-xs rounded-xl border outline-none leading-relaxed transition-colors ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                <Save className="w-4 h-4 mr-1.5" />
                {viewMode === 'edit' ? 'Simpan Perubahan' : 'Simpan FAQ'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
