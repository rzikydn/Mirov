import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink } from 'lucide-react';
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

interface InstallationDialogProps {
  show: boolean;
  darkMode: boolean;
  onClose: () => void;
}

export default function InstallationDialog({ show, darkMode, onClose }: InstallationDialogProps) {
  const [copied, setCopied] = useState(false);
  const embedCode = `<script src="https://planner.bsmr.org/chatbot.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Kode embed berhasil disalin!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Code className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            Kode Embed Script (Installation)
          </DialogTitle>
          <DialogDescription>
            Salin 1 baris kode script HTML di bawah ini dan pasang pada bagian &lt;head&gt; atau sebelum tag &lt;/body&gt; pada website resmi (bsmr.or.id).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Embed Script Tag</label>
              <Input
                readOnly
                value={embedCode}
                className="font-mono text-xs text-black dark:text-black font-semibold bg-gray-50 border-gray-200 dark:border-gray-700 select-all"
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleCopy}
              className={`mt-5 shrink-0 ${copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
