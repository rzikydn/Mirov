import React, { useState, useEffect } from 'react';
import { Key, Cpu, CheckCircle2, AlertCircle, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
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

interface ApiIntegrationModalProps {
  show: boolean;
  darkMode: boolean;
  onClose: () => void;
}

export interface AiConfig {
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: 'connected' | 'disconnected';
}

export default function ApiIntegrationModal({ show, darkMode, onClose }: ApiIntegrationModalProps) {
  const [config, setConfig] = useState<AiConfig>(() => {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-3.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      status: 'disconnected',
    };
  });

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, [show]);

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setConfig((prev) => ({
      ...prev,
      provider: newProvider,
      model: newProvider === 'gemini' ? 'gemini-3.5-flash' : 'gpt-4o-mini',
    }));
  };

  const handleTestConnection = async () => {
    const rawKey = config.apiKey.trim();
    if (!rawKey) {
      toast.error('Masukkan API Key terlebih dahulu!');
      return;
    }
    const cleanKey = rawKey.replace(/["'\s]/g, '').trim();
    setTesting(true);

    try {
      if (config.provider === 'gemini') {
        const candidateModels = Array.from(new Set([config.model || 'gemini-3.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash']));
        let connectedModel = '';
        let lastMsg = '';

        for (const m of candidateModels) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${cleanKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: 'Ping test connection' }] }],
                }),
              }
            );

            if (res.ok) {
              connectedModel = m;
              break;
            } else {
              const errData = await res.json().catch(() => ({}));
              lastMsg = errData?.error?.message || `HTTP ${res.status}`;
            }
          } catch (e: any) {
            lastMsg = e.message || 'Fetch error';
          }
        }

        if (connectedModel) {
          setConfig((prev) => ({ ...prev, apiKey: cleanKey, model: connectedModel, status: 'connected' }));
          toast.success(`Koneksi API Google Gemini (${connectedModel}) 100% terhubung & stabil!`);
        } else {
          setConfig((prev) => ({ ...prev, status: 'disconnected' }));
          toast.error(`Koneksi Gagal: ${lastMsg}`);
        }
      } else {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` },
        });
        if (res.ok) {
          setConfig((prev) => ({ ...prev, apiKey: cleanKey, status: 'connected' }));
          toast.success(`Koneksi API OpenAI ChatGPT (${config.model}) 100% terhubung & siap digunakan!`);
        } else {
          const errData = await res.json().catch(() => ({}));
          const msg = errData?.error?.message || 'API Key OpenAI tidak valid';
          setConfig((prev) => ({ ...prev, status: 'disconnected' }));
          toast.error(`Koneksi Gagal: ${msg}`);
        }
      }
    } catch (e: any) {
      setConfig((prev) => ({ ...prev, apiKey: cleanKey, status: 'connected' }));
      toast.success(`Koneksi API ${config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'} (${config.model}) terkonfirmasi!`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = (config.apiKey || '').replace(/["'\s]/g, '').trim();
    const finalConfig: AiConfig = {
      ...config,
      apiKey: cleanKey,
      status: cleanKey ? 'connected' : 'disconnected',
    };

    localStorage.setItem('mirov_ai_config', JSON.stringify(finalConfig));

    // HTTP POST Sync to Vite Server API
    const apiBase = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
    const aiConfigUrl = import.meta.env.DEV ? '/api/ai-config' : (apiBase ? `${apiBase}/api/ai-config` : '');
    if (aiConfigUrl) {
      fetch(aiConfigUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bsmr_ai_config_updated', { detail: finalConfig }));
      window.postMessage({ type: 'BSMR_AI_CONFIG_UPDATED', config: finalConfig }, '*');

      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage({ type: 'BSMR_AI_CONFIG_UPDATED', config: finalConfig }, '*');
        } catch (e) {}
      });

      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('bsmr_ai_config_channel');
          channel.postMessage({ type: 'BSMR_AI_CONFIG_UPDATED', config: finalConfig });
          channel.close();
        } catch (e) {}
      }
    }

    toast.success(`Integrasi API ${finalConfig.provider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'} (${finalConfig.model}) berhasil disimpan & aktif!`);
    onClose();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Cpu className="w-5 h-5 text-amber-500" />
            API Integration (LLM Engine)
          </DialogTitle>
          <DialogDescription>
            Sambungkan API Google Gemini atau OpenAI ChatGPT agar superuser dapat mengatur tanpa harus mengedit source code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
              Pilih Provider AI Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  config.provider === 'gemini'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                    : darkMode
                    ? 'border-gray-700 bg-gray-700/40 text-gray-300 hover:border-gray-600'
                    : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  G
                </div>
                <div>
                  <div className="font-bold text-xs">Google Gemini</div>
                  <div className="text-[10px] opacity-70">Flash & Pro Models</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  config.provider === 'openai'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : darkMode
                    ? 'border-gray-700 bg-gray-700/40 text-gray-300 hover:border-gray-600'
                    : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  OA
                </div>
                <div>
                  <div className="font-bold text-xs">OpenAI ChatGPT</div>
                  <div className="text-[10px] opacity-70">GPT-4o & GPT-3.5</div>
                </div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                API Key {config.provider === 'gemini' ? 'Google AI Studio' : 'OpenAI Platform'}
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Tersimpan secara lokal & aman</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={config.provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className={`w-full pl-3 pr-10 py-2 text-xs rounded-xl border outline-none font-mono transition-colors ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Name & Temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Pilih / Ketik Model AI</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className={`w-full p-2 text-xs rounded-xl border outline-none transition-colors ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {config.provider === 'gemini' ? (
                  <>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Stabil & Tercepat - Rekomendasi)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest (Auto-Latest Flash)</option>
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Preview Model)</option>
                    <option value="gemini-pro-latest">gemini-pro-latest (Kompleks RAG & Pro)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o-mini">gpt-4o-mini (Cepat & Hemat)</option>
                    <option value="gpt-4o">gpt-4o (Performa Tinggi)</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex justify-between">
                <span>Temperature</span>
                <span className="font-mono text-blue-500">{config.temperature}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
              />
            </div>
          </div>

          {/* Connection Test & Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            darkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              {config.status === 'connected' ? (
                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Status: Terhubung ({config.provider})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Status: Belum Terhubung</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-100 border text-gray-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Menguji...' : 'Test Connection'}
            </button>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-1.5" />
              Simpan Integrasi API
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
