import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  X,
  Database,
  ChevronDown,
  Activity,
} from 'lucide-react';
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
import { getAiUsageStats, AiUsageStats } from '@/services/aiUsageService';

interface ApiIntegrationModalProps {
  show: boolean;
  darkMode: boolean;
  onClose: () => void;
}

export type AiProvider = 'groq';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: 'connected' | 'disconnected';
  timeZone?: string;
  filterWords?: string[];
}

export default function ApiIntegrationModal({ show, darkMode, onClose }: ApiIntegrationModalProps) {
  const [config, setConfig] = useState<AiConfig>(() => {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const prov: AiProvider = 'groq';
        return {
          provider: prov,
          apiKey: parsed.apiKey || '',
          model: parsed.model && (parsed.model.includes('llama') || parsed.model.includes('qwen')) ? parsed.model : 'llama-3.3-70b-versatile',
          temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.7,
          maxTokens: parsed.maxTokens || 2048,
          status: parsed.status || 'disconnected',
          timeZone: parsed.timeZone || 'Asia/Jakarta (WIB, GMT+7)',
          filterWords: Array.isArray(parsed.filterWords) ? parsed.filterWords : ['kata-kasar', 'promosi-ilegal'],
        };
      } catch (e) {}
    }
    return {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 2048,
      status: 'disconnected',
      timeZone: 'Asia/Jakarta (WIB, GMT+7)',
      filterWords: ['kata-kasar', 'promosi-ilegal'],
    };
  });

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [newFilterWord, setNewFilterWord] = useState('');
  const [usageStats, setUsageStats] = useState<AiUsageStats>(getAiUsageStats);

  useEffect(() => {
    const saved = localStorage.getItem('mirov_ai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const prov: AiProvider = 'groq';
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          provider: prov,
          model: parsed.model && (parsed.model.includes('llama') || parsed.model.includes('qwen')) ? parsed.model : 'llama-3.3-70b-versatile',
          filterWords: Array.isArray(parsed.filterWords) ? parsed.filterWords : prev.filterWords,
        }));
      } catch (e) {}
    }
    setUsageStats(getAiUsageStats());

    const handleUsageUpdated = (e: any) => {
      if (e.detail) setUsageStats(e.detail);
      else setUsageStats(getAiUsageStats());
    };
    window.addEventListener('mirov_ai_usage_updated', handleUsageUpdated);
    return () => window.removeEventListener('mirov_ai_usage_updated', handleUsageUpdated);
  }, [show]);

  const handleAddFilterWord = () => {
    const trimmed = newFilterWord.trim();
    if (!trimmed) return;
    const current = config.filterWords || [];
    if (!current.includes(trimmed)) {
      setConfig((prev) => ({
        ...prev,
        filterWords: [...(prev.filterWords || []), trimmed],
      }));
    }
    setNewFilterWord('');
  };

  const handleRemoveFilterWord = (wordToRemove: string) => {
    setConfig((prev) => ({
      ...prev,
      filterWords: (prev.filterWords || []).filter((w) => w !== wordToRemove),
    }));
  };

  const handleKeyDownFilterWord = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFilterWord();
    }
  };

  const handleTestConnection = async () => {
    const rawKey = config.apiKey.trim();
    if (!rawKey) {
      toast.error('Masukkan API Key Groq terlebih dahulu!');
      return;
    }
    const cleanKey = rawKey.replace(/["'\s]/g, '').trim();
    setTesting(true);

    try {
      const candidateModels = [
        config.model || 'llama-3.3-70b-versatile',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'qwen/qwen3.6-27b',
      ];
      let connectedModel = '';
      let lastMsg = '';

      for (const m of candidateModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanKey}`,
            },
            body: JSON.stringify({
              model: m,
              messages: [{ role: 'user', content: 'Ping' }],
              max_tokens: 10,
            }),
          });

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
        const autoConfig: AiConfig = {
          ...config,
          apiKey: cleanKey,
          model: connectedModel,
          status: 'connected',
        };
        setConfig(autoConfig);
        broadcastConfig(autoConfig);
        toast.success(`Koneksi API Groq LPU (${connectedModel}) 100% terhubung & aktif!`);
      } else {
        setConfig((prev) => ({ ...prev, status: 'disconnected' }));
        toast.error(`Koneksi Gagal: ${lastMsg}`);
      }
    } catch (e: any) {
      setConfig((prev) => ({ ...prev, status: 'disconnected' }));
      toast.error(`Gagal menghubungi server Groq: ${e.message || 'Network error'}`);
    } finally {
      setTesting(false);
    }
  };

  const broadcastConfig = (finalConfig: AiConfig) => {
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
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = (config.apiKey || '').replace(/["'\s]/g, '').trim();
    const finalConfig: AiConfig = {
      ...config,
      apiKey: cleanKey,
      status: cleanKey ? 'connected' : 'disconnected',
    };

    broadcastConfig(finalConfig);

    toast.success(
      `Integrasi API Groq LPU (${finalConfig.model}) berhasil disimpan & aktif!`
    );
    onClose();
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M Tokens`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K Tokens`;
    return `${tokens} Tokens`;
  };

  const isConnected = config.status === 'connected' && Boolean(config.apiKey && config.apiKey.trim());

  const displayPlanTokens = isConnected ? (usageStats.dataPlanTokens || 1000000) : 0;
  const displayUsedTokens = isConnected ? (usageStats.byProvider?.groq || usageStats.totalTokensUsed || 0) : 0;
  const displayLeftTokens = isConnected ? Math.max(0, displayPlanTokens - displayUsedTokens) : 0;

  const usedPercent = isConnected && displayPlanTokens > 0
    ? Math.min(100, Math.max(0, (displayUsedTokens / displayPlanTokens) * 100))
    : 0;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 pb-3 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <Cpu className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            API Integration (LLM Engine)
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Konfigurasi model AI, otentikasi API key, zona waktu, knowledge base, dan filter kata pada widget AI Chatbot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto hide-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-3 space-y-4">
          {/* Data Usage Overview Meter */}
          <div className="p-4 rounded-xl border bg-white dark:bg-gray-800/90 border-gray-200/90 dark:border-gray-700 shadow-2xs">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5">
                <Activity className={`w-4 h-4 ${isConnected ? 'text-sky-500' : 'text-gray-400'}`} />
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                  Data Usage Overview <span className="text-[11px] font-normal text-gray-400">as of {usageStats.currentPeriodStart}</span>
                </h4>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}>
                {isConnected ? 'Groq Connected' : 'Belum Terhubung'}
              </span>
            </div>

            {/* Progress Bar Container with Interactive Tooltip Pin */}
            <div className="relative pt-6 pb-2">
              {/* Pin Tooltip */}
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
                style={{ left: isConnected ? `${Math.min(94, Math.max(8, usedPercent))}%` : '8%' }}
              >
                <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-xs whitespace-nowrap ${
                  isConnected ? 'bg-sky-500' : 'bg-gray-400 dark:bg-gray-600'
                }`}>
                  {formatTokens(displayUsedTokens)} Used
                </span>
                <div className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
                  isConnected ? 'border-t-sky-500' : 'border-t-gray-400 dark:border-t-gray-600'
                }`} />
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 rounded-l-full ${
                    isConnected ? 'bg-sky-500' : 'bg-transparent'
                  }`}
                  style={{ width: isConnected ? `${Math.min(100, Math.max(2, usedPercent))}%` : '0%' }}
                />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700" />
                {isConnected && <div className="w-3 h-full bg-rose-300 dark:bg-rose-900/60 rounded-r-full" />}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs">
              <div>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Current Usage Period</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{usageStats.currentPeriodStart} - {usageStats.currentPeriodEnd}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Days Left</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{usageStats.daysLeft} Hari</span>
              </div>
              <div className="sm:border-l sm:pl-3 border-gray-200 dark:border-gray-700">
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Data Plan</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {isConnected ? formatTokens(displayPlanTokens) : '0 Tokens'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Data Used</span>
                <span className={`font-bold ${isConnected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {formatTokens(displayUsedTokens)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Data Left</span>
                <span className={`font-bold ${isConnected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isConnected ? formatTokens(displayLeftTokens) : '0 Tokens'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 1: AI Model */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="sm:w-[35%] shrink-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Model</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Pilih provider dan model AI engine
              </p>
            </div>

            <div className="sm:w-[65%] space-y-2">
              {/* Provider Selection Pills */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300 shadow-2xs cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Groq LPU</span>
                </button>
              </div>

              {/* Model Dropdown Box */}
              <div className="relative">
                <select
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className={`w-full h-10 pl-3.5 pr-10 text-xs font-medium rounded-xl border outline-none appearance-none transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-gray-800/90 border-gray-700 text-gray-100 focus:border-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 shadow-2xs'
                  }`}
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Cerdas & Akurat) - Groq</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra Cepat) - Groq</option>
                  <option value="qwen/qwen3.6-27b">Qwen 3.6 27B - Groq</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: API Key */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="sm:w-[35%] shrink-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">API Key</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Kunci autentikasi Groq (gsk_...) dari console.groq.com/keys
              </p>
            </div>

            <div className="sm:w-[65%]">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className={`w-full h-10 pl-3.5 pr-10 text-xs font-mono rounded-xl border outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800/90 border-gray-700 text-gray-100 focus:border-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 shadow-2xs'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title={showKey ? 'Sembunyikan Key' : 'Lihat Key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Knowledge Base */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="sm:w-[35%] shrink-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Knowledge Base</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Fine-tune the assistant to your needs
              </p>
            </div>

            <div className="sm:w-[65%]">
              <div className={`h-10 px-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                darkMode ? 'bg-gray-800/90 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800 shadow-2xs'
              }`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span>BSMR Knowledge Base (RAG Indexed)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Filter Words */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="sm:w-[35%] shrink-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Filter Words</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Restricted words remain unspoken
              </p>
            </div>

            <div className="sm:w-[65%] space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Start typing to add"
                  value={newFilterWord}
                  onChange={(e) => setNewFilterWord(e.target.value)}
                  onKeyDown={handleKeyDownFilterWord}
                  className={`w-full h-10 pl-3.5 pr-14 text-xs rounded-xl border outline-none transition-colors ${
                    darkMode
                      ? 'bg-gray-800/90 border-gray-700 text-gray-100 focus:border-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 shadow-2xs'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddFilterWord}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  Enter
                </button>
              </div>

              {/* Tag Badges List */}
              {config.filterWords && config.filterWords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {config.filterWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveFilterWord(word)}
                        className="hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Status & Diagnostics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
            <div className="sm:w-[35%] shrink-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Status Koneksi</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Verifikasi real-time ke provider
              </p>
            </div>

            <div className="sm:w-[65%] flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {config.status === 'connected' ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terhubung ({config.provider})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Belum Terhubung</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                    : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 shadow-2xs'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Menguji...' : 'Test Connection'}
              </button>
            </div>
          </div>

        </form>

        <DialogFooter className="shrink-0 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
              Batal
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Simpan Integrasi API
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
