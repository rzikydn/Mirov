import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Search,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ThumbsUp,
  Sparkles,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';
import { BotIcon } from '../ui/BotIcon';
import VisitorChatLogsWidget from '../ui/VisitorChatLogsWidget';

interface ChatbotDashboardProps {
  darkMode: boolean;
}

// Demo data for Knowledge Base
interface KBItem {
  id: string;
  title: string;
  type: 'PDF' | 'Word' | 'FAQ';
  category: string;
  updatedAt: string;
  size?: string;
  status: 'Indexed' | 'Processing';
  question?: string;
  answer?: string;
}

const initialKB: KBItem[] = [
  {
    id: 'kb-1',
    title: 'Silabus_Sertifikasi_BSMR_Level_2_Revisi_2026.pdf',
    type: 'PDF',
    category: 'Silabus',
    updatedAt: '18 Aug 2026',
    size: '2.4 MB',
    status: 'Indexed',
  },
  {
    id: 'kb-2',
    title: 'Jadwal_Asesmen_Periode_Q3_2026.pdf',
    type: 'PDF',
    category: 'Jadwal Asesmen',
    updatedAt: '15 Aug 2026',
    size: '1.1 MB',
    status: 'Indexed',
  },
  {
    id: 'kb-3',
    title: 'Tabel_Biaya_Sertifikasi_Terbaru.docx',
    type: 'Word',
    category: 'Biaya & Administrasi',
    updatedAt: '10 Aug 2026',
    size: '850 KB',
    status: 'Indexed',
  },
  {
    id: 'kb-4',
    title: 'Berapa masa berlaku sertifikat BSMR?',
    question: 'Berapa masa berlaku sertifikat BSMR?',
    answer: 'Sertifikat BSMR berlaku selama 3 (tiga) tahun sejak tanggal diterbitkan. Pemegang sertifikat wajib melakukan pemeliharaan melalui kegiatan Pemeliharaan Sertifikasi (Maintenance Program) sebelum masa berlaku berakhir.',
    type: 'FAQ',
    category: 'Masa Berlaku & Maintenance',
    updatedAt: '12 Aug 2026',
    status: 'Indexed',
  },
];

// Demo Chat Logs
interface ChatLog {
  id: string;
  visitor: string;
  time: string;
  topic: string;
  messages: { sender: 'user' | 'bot'; text: string; time: string }[];
  feedback?: 'positive' | 'negative' | null;
}

const initialLogs: ChatLog[] = [
  {
    id: 'log-101',
    visitor: 'Pengunjung #4092 (Jakarta)',
    time: 'Hari ini, 16:45',
    topic: 'Jadwal Sertifikasi Level 2',
    feedback: 'positive',
    messages: [
      { sender: 'user', text: 'Kapan jadwal ujian sertifikasi BSMR Level 2 bulan September?', time: '16:45' },
      { sender: 'bot', text: 'Jadwal Asesmen BSMR Level 2 periode September 2026 dilaksanakan pada tanggal 12-14 September 2026. Pendaftaran ditutup pada 5 September 2026.', time: '16:45' },
      { sender: 'user', text: 'Berapa biayanya?', time: '16:46' },
      { sender: 'bot', text: 'Biaya Sertifikasi Level 2 adalah Rp 4.500.000,- (belum termasuk PPN 11%). Informasi lengkap dapat diunduh pada tabel biaya resmi BSMR.', time: '16:46' },
    ],
  },
  {
    id: 'log-102',
    visitor: 'Pengunjung #4088 (Surabaya)',
    time: 'Hari ini, 14:20',
    topic: 'Perpanjangan Sertifikat',
    feedback: 'positive',
    messages: [
      { sender: 'user', text: 'Syarat pemeliharaan sertifikat sertifikasi level 1 apa saja ya?', time: '14:20' },
      { sender: 'bot', text: 'Untuk pemeliharaan (maintenance) sertifikat Level 1, asesi wajib memenuhi minimal 12 poin SKP melalui workshop/webinar resmi BSMR dalam kurun waktu 3 tahun.', time: '14:20' },
    ],
  },
];

// Demo Unresolved Inquiries
interface UnresolvedItem {
  id: string;
  question: string;
  count: number;
  lastAsked: string;
  status: 'Pending' | 'Resolved';
}

const initialUnresolved: UnresolvedItem[] = [
  {
    id: 'unres-1',
    question: 'Apakah ada program beasiswa sertifikasi untuk mahasiswa perbankan?',
    count: 14,
    lastAsked: 'Hari ini, 15:10',
    status: 'Pending',
  },
  {
    id: 'unres-2',
    question: 'Apakah bisa pembayaran sertifikasi menggunakan sistem cicilan institusi?',
    count: 8,
    lastAsked: 'Kemarin, 11:30',
    status: 'Pending',
  },
];

export default function ChatbotDashboard({ darkMode }: ChatbotDashboardProps) {
  const [activeTab, setActiveTab] = useState<'kb' | 'logs' | 'unresolved' | 'analytics' | 'settings'>('kb');

  // Knowledge Base State
  const [kbList, setKbList] = useState<KBItem[]>(initialKB);
  const [searchKB, setSearchKB] = useState('');
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('Umum');

  // Unresolved state
  const [unresolvedList, setUnresolvedList] = useState<UnresolvedItem[]>(initialUnresolved);
  const [selectedUnresolved, setSelectedUnresolved] = useState<UnresolvedItem | null>(null);
  const [resolveAnswer, setResolveAnswer] = useState('');

  // Settings State
  const [welcomeMsg, setWelcomeMsg] = useState('Halo! Selamat datang di Website Resmi BSMR. Ada yang bisa kami bantu terkait Sertifikasi Manajemen Risiko Perbankan?');
  const [waNumber, setWaNumber] = useState('6281299008899');
  const [systemPrompt, setSystemPrompt] = useState('Anda adalah AI Assistant Resmi BSMR (Badan Sertifikasi Manajemen Risiko). Berikan jawaban yang ramah, profesional, akurat sesuai dengan dokumen Knowledge Base BSMR.');
  const [copiedScript, setCopiedScript] = useState(false);

  const embedCode = `<script src="https://planner.bsmr.org/chatbot.js" data-bsmr-bot="v2"></script>`;

  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;

    const newItem: KBItem = {
      id: `kb-${Date.now()}`,
      title: faqQuestion,
      question: faqQuestion,
      answer: faqAnswer,
      type: 'FAQ',
      category: faqCategory,
      updatedAt: 'Baru saja',
      status: 'Indexed',
    };

    setKbList([newItem, ...kbList]);
    setFaqQuestion('');
    setFaqAnswer('');
    setShowFAQModal(false);
  };

  const handleResolveToKB = () => {
    if (!selectedUnresolved || !resolveAnswer) return;

    const newItem: KBItem = {
      id: `kb-${Date.now()}`,
      title: selectedUnresolved.question,
      question: selectedUnresolved.question,
      answer: resolveAnswer,
      type: 'FAQ',
      category: 'Hasil Evaluasi Inquiry',
      updatedAt: 'Baru saja',
      status: 'Indexed',
    };

    setKbList([newItem, ...kbList]);
    setUnresolvedList(unresolvedList.filter((u) => u.id !== selectedUnresolved.id));
    setSelectedUnresolved(null);
    setResolveAnswer('');
  };

  const handleDeleteKB = (id: string) => {
    setKbList(kbList.filter((k) => k.id !== id));
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const filteredKB = kbList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchKB.toLowerCase()) ||
      item.category.toLowerCase().includes(searchKB.toLowerCase())
  );

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
          darkMode
            ? 'bg-gray-800/80 border-gray-700/80'
            : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border-blue-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <BotIcon size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">AI Chatbot Admin Dashboard</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                bsmr.org Widget
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola materi sertifikasi RAG, pantau percakapan calon asesi, dan evaluasi pertanyaan terbaru.
            </p>
          </div>
        </div>

        {/* Quick Embed Snippet Button */}
        <button
          onClick={handleCopyScript}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-all ${
            copiedScript
              ? 'bg-emerald-600 text-white border-emerald-600'
              : darkMode
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200'
              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm'
          }`}
        >
          {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedScript ? 'Script Copied!' : 'Copy Embed Script'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-2 border-gray-200 dark:border-gray-700 hide-scrollbar">
        {[
          { id: 'kb', label: 'Knowledge Base', icon: FileText, badge: kbList.length },
          { id: 'logs', label: 'Chat Logs', icon: MessageSquare },
          { id: 'unresolved', label: 'Unresolved Inquiries', icon: HelpCircle, badge: unresolvedList.length, alert: true },
          { id: 'analytics', label: 'Analitik & Statistik', icon: BarChart3 },
          { id: 'settings', label: 'Pengaturan & Prompt', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Knowledge Base Management */}
      {activeTab === 'kb' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari materi atau FAQ..."
                value={searchKB}
                onChange={(e) => setSearchKB(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border outline-none transition-colors ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 focus:border-blue-500'
                    : 'bg-white border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>Upload PDF / Word</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const newItem: KBItem = {
                        id: `kb-${Date.now()}`,
                        title: file.name,
                        type: file.name.endsWith('.pdf') ? 'PDF' : 'Word',
                        category: 'Dokumen Resmi',
                        updatedAt: 'Baru saja',
                        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                        status: 'Indexed',
                      };
                      setKbList([newItem, ...kbList]);
                    }
                  }}
                />
              </label>

              <button
                onClick={() => setShowFAQModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input FAQ Cepat</span>
              </button>
            </div>
          </div>

          {/* Table of KB Documents */}
          <div className={`border rounded-xl overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`${darkMode ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-50 text-gray-500'} font-semibold border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <tr>
                  <th className="p-3.5">Dokumen / Pertanyaan</th>
                  <th className="p-3.5">Tipe</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Status Index RAG</th>
                  <th className="p-3.5">Terakhir Diperbarui</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredKB.map((item) => (
                  <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50/80'} transition-colors`}>
                    <td className="p-3.5 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${item.type === 'PDF' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : item.type === 'Word' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                          {item.answer && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{item.answer}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 dark:text-gray-400">{item.category}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-500 dark:text-gray-400">{item.updatedAt}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteKB(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Input FAQ Cepat */}
          {showFAQModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Input FAQ Resmi Baru
                </h3>
                <form onSubmit={handleAddFAQ} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Pertanyaan (User Query)</label>
                    <input
                      type="text"
                      required
                      placeholder="Misal: Berapa biaya Sertifikasi BSMR Level 1?"
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Jawaban Resmi AI</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Masukkan jawaban yang akurat dan komprehensif..."
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Kategori Materi</label>
                    <select
                      value={faqCategory}
                      onChange={(e) => setFaqCategory(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      <option value="Silabus & Kurikulum">Silabus & Kurikulum</option>
                      <option value="Jadwal Asesmen">Jadwal Asesmen</option>
                      <option value="Biaya & Administrasi">Biaya & Administrasi</option>
                      <option value="Masa Berlaku & Maintenance">Masa Berlaku & Maintenance</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFAQModal(false)}
                      className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      Simpan & Indeks AI
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Chat Logs (Dynamic Real-Time Visitor Sync & Escalation) */}
      {activeTab === 'logs' && (
        <VisitorChatLogsWidget darkMode={darkMode} fullHeight={true} />
      )}

      {/* Tab 3: Unresolved Inquiries */}
      {activeTab === 'unresolved' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${darkMode ? 'bg-amber-900/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs">
              Daftar pertanyaan yang gagal dijawab AI karena belum ada di materi/dokumen. Anda dapat langsung menginput jawabannya di sini agar AI otomatis mempelajarinya!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`border rounded-xl p-4 space-y-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pertanyaan Belum Terjawab</h3>
              <div className="space-y-2">
                {unresolvedList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedUnresolved(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUnresolved?.id === item.id
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/20'
                        : darkMode
                        ? 'border-gray-700 hover:bg-gray-700/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{item.question}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                      <span>Ditanyakan {item.count}x oleh pengunjung</span>
                      <span>Terakhir: {item.lastAsked}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border rounded-xl p-5 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              {selectedUnresolved ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">Tambahkan Jawaban Resmi ke KB</h3>
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-xs">
                    <span className="font-semibold block mb-1 text-gray-500">Pertanyaan Asesi:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedUnresolved.question}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Jawaban Resmi dari BSMR:</label>
                    <textarea
                      rows={5}
                      placeholder="Ketikkan jawaban resmi BSMR di sini..."
                      value={resolveAnswer}
                      onChange={(e) => setResolveAnswer(e.target.value)}
                      className={`w-full p-3 text-xs rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>

                  <button
                    onClick={handleResolveToKB}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan & Terbitkan ke AI Vector RAG
                  </button>
                </div>
              ) : (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <HelpCircle className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs">Pilih salah satu pertanyaan di sebelah kiri untuk memasukkan jawaban resminya.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Chat Pengunjung (Bulan Ini)', val: '1,420', sub: '+18% dari bulan lalu', color: 'text-blue-500' },
              { label: 'Pertanyaan Terjawab Otomatis', val: '94.2%', sub: 'RAG Accuracy Rate', color: 'text-emerald-500' },
              { label: 'Tingkat Kepuasan (Thumbs Up)', val: '96.5%', sub: 'Dari 840 ulasan', color: 'text-amber-500' },
              { label: 'Pertanyaan Paling Populer', val: 'Sertifikasi Lvl 2', sub: '38% dari total query', color: 'text-indigo-500' },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.val}</p>
                <p className="text-[10px] text-gray-400 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold text-sm mb-4">Jam-Jam Sibuk Pengunjung Bertanya (Peak Hours)</h3>
            <div className="h-40 flex items-end gap-3 pt-6 border-b border-gray-200 dark:border-gray-700 pb-2">
              {[15, 30, 45, 80, 95, 100, 75, 60, 40, 25, 10].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    style={{ height: `${height}%` }}
                    className="w-full bg-blue-500/80 group-hover:bg-blue-600 rounded-t transition-all"
                  />
                  <span className="text-[9px] text-gray-400">{8 + i}:00</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Jam sibuk tertinggi berada pada pukul 13:00 - 15:00 WIB (Waktu Kerja).</p>
          </div>
        </div>
      )}

      {/* Tab 5: Settings & Prompt AI */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-5 rounded-xl border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold text-sm border-b pb-3 border-gray-200 dark:border-gray-700">Pengaturan Widget & Pesan</h3>

            <div>
              <label className="block text-xs font-medium mb-1">Pesan Pembuka Widget (Welcome Message)</label>
              <textarea
                rows={3}
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                Nomor WhatsApp CS BSMR (Fallback Escalation)
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">System Prompt AI Bot</label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-lg border outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors">
              Simpan Pengaturan
            </button>
          </div>

          {/* Embed Script Snippet */}
          <div className={`p-5 rounded-xl border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-bold text-sm border-b pb-3 border-gray-200 dark:border-gray-700">Kode Embed Widget bsmr.org</h3>
            <p className="text-xs text-gray-400">
              Salin 1 baris kode script berikut dan pasang di bagian &lt;head&gt; atau sebelum tag &lt;/body&gt; pada website resmi BSMR (bsmr.or.id):
            </p>

            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-black font-mono text-[11px] break-all relative group border border-gray-200 dark:border-gray-700">
              <code>{embedCode}</code>
              <button
                onClick={handleCopyScript}
                className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Copy Code"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs space-y-2">
              <span className="font-bold text-blue-700 dark:text-blue-300">Status Koneksi API Embed:</span>
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>planner.bsmr.org/chatbot.js Active & Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
