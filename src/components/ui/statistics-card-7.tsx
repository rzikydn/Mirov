import React, { useState, useEffect } from 'react';
import { getChatbotAnalytics, ChatbotAnalytics } from '../../services/chatbotAnalytics';

interface StatisticCard7Props {
  darkMode?: boolean;
}

export default function StatisticCard7({ darkMode }: StatisticCard7Props) {
  const [analytics, setAnalytics] = useState<ChatbotAnalytics>(getChatbotAnalytics);

  useEffect(() => {
    const handleUpdate = () => {
      setAnalytics(getChatbotAnalytics());
    };

    window.addEventListener('bsmr_analytics_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('bsmr_analytics_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const total = Math.max(analytics.totalInteractions, 1);
  const solvedPercent = ((analytics.solvedCount / total) * 100).toFixed(1);
  const escalatedPercent = ((analytics.escalatedCount / total) * 100).toFixed(1);
  const outOfHoursPercent = ((analytics.outOfHoursCount / total) * 100).toFixed(1);

  const cards = [
    {
      title: 'TOTAL INTERAKSI PENGUNJUNG',
      subtitle: 'Bulan ini (bsmr.org)',
      value: `${analytics.totalInteractions.toLocaleString('id-ID')} Sesi`,
      subtext: (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          +{analytics.monthlyGrowth} sesi <span className="text-gray-500 dark:text-gray-400 font-normal">vs bulan lalu</span>
        </span>
      ),
    },
    {
      title: 'PENYELESAIAN MANDIRI',
      subtitle: 'Otomatis dijawab AI',
      value: `${solvedPercent}%`,
      subtext: (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {analytics.solvedCount.toLocaleString('id-ID')} <span className="text-gray-500 dark:text-gray-400 font-normal">pertanyaan tuntas</span>
        </span>
      ),
    },
    {
      title: 'ESKALASI KE CS ADMIN',
      subtitle: 'Bantuan Admin BSMR',
      value: `${escalatedPercent}%`,
      subtext: (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {analytics.escalatedCount.toLocaleString('id-ID')} <span className="text-gray-500 dark:text-gray-400 font-normal">asesi terhubung CS</span>
        </span>
      ),
    },
    {
      title: 'CHAT LUAR JAM KERJA',
      subtitle: 'Malam & hari libur',
      value: `${outOfHoursPercent}%`,
      subtext: (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {analytics.outOfHoursCount.toLocaleString('id-ID')} <span className="text-gray-500 dark:text-gray-400 font-normal">interaksi malam & libur</span>
        </span>
      ),
    },
  ];

  return (
    <div className="w-full py-1">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border w-full overflow-hidden transition-colors ${
        darkMode ? 'bg-gray-800/80 border-gray-700 divide-y sm:divide-y-0 lg:divide-x divide-gray-700' : 'bg-white border-gray-200 divide-y sm:divide-y-0 lg:divide-x divide-gray-200 shadow-xs'
      }`}>
        {cards.map((card, i) => {
          return (
            <div key={i} className="p-4 flex flex-col justify-between space-y-3">
              {/* Title & Subtitle */}
              <div className="space-y-0.5">
                <h3 className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.subtitle}</p>
              </div>

              {/* Information */}
              <div className="flex flex-col gap-1.5">
                {/* Value */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {card.value}
                  </span>
                </div>
                {/* Subtext */}
                <div className="text-[11px]">{card.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
