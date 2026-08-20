import React, { useState } from 'react';
import { HelpCircle, Save, Plus } from 'lucide-react';
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

interface InputFaqModalProps {
  show: boolean;
  darkMode?: boolean;
  onClose: () => void;
  onSuccess?: (faq: { question: string; answer: string; category: string }) => void;
}

export default function InputFaqModal({ show, darkMode, onClose, onSuccess }: InputFaqModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Umum');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('Pertanyaan dan Jawaban wajib diisi!');
      return;
    }

    if (onSuccess) {
      onSuccess({ question, answer, category });
    }

    toast.success('FAQ berhasil ditambahkan!');
    setQuestion('');
    setAnswer('');
    onClose();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="w-5 h-5 text-blue-500" />
            Input FAQ Cepat
          </DialogTitle>
          <DialogDescription>
            Menambahkan pasangan pertanyaan & jawaban kustom langsung ke otak AI Vector RAG.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Pertanyaan FAQ
            </label>
            <Input
              placeholder="Contoh: Berapa biaya sertifikasi BSMR Level 1?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Kategori FAQ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="Umum">Umum</option>
              <option value="Jadwal & Sertifikasi">Jadwal & Sertifikasi</option>
              <option value="Biaya & Administrasi">Biaya & Administrasi</option>
              <option value="Pemeliharaan (SKP)">Pemeliharaan (SKP)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Jawaban Resmi
            </label>
            <textarea
              rows={4}
              placeholder="Ketikkan jawaban resmi BSMR di sini..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan FAQ Cepat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
