import React, { useState } from 'react';
import ChartBarInteractive from './ChartBarInteractive';
import ChartBarHorizontal from './ChartBarHorizontal';
import RecentActivity from './RecentActivity';

interface HistoryPageProps {
  darkMode: boolean;
}

const HistoryPage: React.FC<HistoryPageProps> = React.memo(({ darkMode }) => {
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });

  const handleApplyDateRange = (start: Date | null, end: Date | null) => {
    setDateFilter({ startDate: start, endDate: end });
  };

  const handleResetDateRange = () => {
    setDateFilter({ startDate: null, endDate: null });
  };

  return (
    <div className={`w-full h-full min-h-screen px-4 sm:px-6 lg:px-[52px] pt-3 pb-8 space-y-3.5 ${darkMode ? 'bg-[#0a0a0c]' : 'bg-white'}`}>
      <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        User Activity Log
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          <ChartBarInteractive darkMode={darkMode} dateFilter={dateFilter} />
        </div>
        <div className="lg:col-span-4">
          <ChartBarHorizontal
            darkMode={darkMode}
            onApplyDateRange={handleApplyDateRange}
            onResetDateRange={handleResetDateRange}
          />
        </div>
      </div>

      <RecentActivity darkMode={darkMode} dateFilter={dateFilter} />
    </div>
  );
});

export default HistoryPage;
