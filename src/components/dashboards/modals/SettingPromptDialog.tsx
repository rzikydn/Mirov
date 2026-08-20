import React, { useState, useEffect } from 'react';
import { Settings, PhoneCall, Bot, Save, Mail } from 'lucide-react';
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
import {
  getChatbotSettings,
  saveChatbotSettings
} from '../../../services/chatbotSettingsService';

interface SettingPromptDialogProps {
  show: boolean;
  darkMode: boolean;
  onClose: () => void;
}

export default function SettingPromptDialog({ show, darkMode, onClose }: SettingPromptDialogProps) {
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (show) {
      const current = getChatbotSettings();
      setWelcomeMsg(current.welcomeMsg);
      setWaNumber(current.waNumber);
      setAdminEmail(current.adminEmail);
      setSystemPrompt(current.systemPrompt);
    }
  }, [show]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveChatbotSettings({
      welcomeMsg,
      waNumber,
      adminEmail,
      systemPrompt,
    });
    toast.success('System Prompt AI berhasil disimpan!');
    onClose();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="w-5 h-5 text-blue-500" />
            Setting & Prompt AI
          </DialogTitle>
          <DialogDescription>
            Atur pesan pembuka otomatis, nomor WhatsApp, email CS admin, serta System Prompt karakter AI Bot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Welcome Message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Pesan Pembuka Widget (Welcome Message)
            </label>
            <textarea
              rows={3}
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* WA CS Escalation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              Nomor WhatsApp CS BSMR (Fallback Escalation)
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Email CS Admin BSMR */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              Alamat Email Admin
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="cs@bsmr.org"
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-colors ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* System Prompt AI */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-500" />
              System Prompt AI Bot
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
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
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
