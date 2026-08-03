import React, { useState, useMemo } from "react"
import { Search, FileText, CalendarDays, X, CheckSquare, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { useHistory, HistoryEntry } from "../../context/HistoryContext"
import { useAuth } from "../../context/AuthContext"

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

type FilterType = 'all' | 'created' | 'edited' | 'deleted'

function categorize(entry: HistoryEntry): 'created' | 'edited' | 'deleted' | 'other' {
  const action = (entry.action || '').toLowerCase()
  const desc = (entry.description || '').toLowerCase()
  if (action === 'create' || action === 'added' || desc.includes('created') || desc.includes('added')) return 'created'
  if (action === 'edit' || action === 'update' || desc.includes('updated') || desc.includes('changed')) return 'edited'
  if (action === 'delete' || action === 'remove' || desc.includes('deleted') || desc.includes('removed')) return 'deleted'
  return 'other'
}

function formatDateTime(date: Date | string | number) {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return { line1: 'Hari ini', line2: '--.-- WIB' }
  }
  const hari = HARI[d.getDay()] || 'Hari'
  const tgl = d.getDate()
  const bulan = BULAN[d.getMonth()] || 'Bulan'
  const tahun = d.getFullYear()
  const jam = String(d.getHours()).padStart(2, '0')
  const menit = String(d.getMinutes()).padStart(2, '0')
  return { line1: `${hari}, ${tgl} ${bulan} ${tahun}`, line2: `${jam}.${menit} WIB` }
}

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

function getUserAvatarUrl(userName?: string, userAvatarsMap: Record<string, string> = {}): string {
  if (!userName) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=b6e3f4&mouth=default,smile,twinkle&eyes=default,happy,wink';

  if (userAvatarsMap[userName]) {
    return userAvatarsMap[userName];
  }

  const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}&backgroundColor=b6e3f4${safeParams}`;
}

function ActionBadge({ category, darkMode }: { category: string; darkMode?: boolean }) {
  const colors: Record<string, string> = {
    created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    edited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    deleted: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  const labels: Record<string, string> = { created: 'Created', edited: 'Updated', deleted: 'Deleted', other: 'Other' }
  const cls = darkMode ? colors[category]?.replace(/bg-\w+-100/g, '').split('dark:').pop() || '' : colors[category]?.split(' dark:')[0] || ''

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {labels[category] || 'Other'}
    </span>
  )
}

function TargetBadge({ target, darkMode }: { target?: string; darkMode?: boolean }) {
  if (!target) return null
  const label = target.toUpperCase()
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap ${
      darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
    }`}>
      <CalendarDays className="w-3 h-3" />
      {label}...
    </span>
  )
}

function RecentActivity({
  darkMode,
  dateFilter,
}: {
  darkMode?: boolean
  dateFilter?: { startDate: Date | null; endDate: Date | null }
}) {
  const { history, deleteBulkHistory } = useHistory()
  const { user, hasRole } = useAuth()
  const isSuperUser = user?.role === 'SUPERUSER' || (hasRole && hasRole(['SUPERUSER']))

  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  // Bulk Select & Delete State (Strictly for SUPERUSER)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    let list = [...(history || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (dateFilter?.startDate && dateFilter?.endDate) {
      const start = new Date(dateFilter.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateFilter.endDate)
      end.setHours(23, 59, 59, 999)
      list = list.filter((e) => {
        const d = new Date(e.createdAt)
        return d >= start && d <= end
      })
    }

    if (filter !== 'all') {
      list = list.filter((e) => categorize(e) === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((e) =>
        e.description.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        (e.targetName || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [history, filter, search, dateFilter])

  const visibleEntries = useMemo(() => filtered.slice(0, 50), [filtered])
  const total = filtered.length

  const allVisibleSelected = useMemo(() => {
    if (visibleEntries.length === 0) return false
    return visibleEntries.every((e) => selectedIds.has(e.id))
  }, [visibleEntries, selectedIds])

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const next = new Set(selectedIds)
      visibleEntries.forEach((e) => next.delete(e.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      visibleEntries.forEach((e) => next.add(e.id))
      setSelectedIds(next)
    }
  }

  const toggleSelectRow = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    if (!isSuperUser || selectedIds.size === 0) return
    setIsDeleting(true)
    const toastId = toast.loading(`Deleting ${selectedIds.size} log items...`)

    try {
      const idsArray = Array.from(selectedIds)
      await deleteBulkHistory(idsArray)
      setSelectedIds(new Set())
      setIsSelectMode(false)
      toast.success(`Successfully deleted ${idsArray.length} log items`, { id: toastId })
    } catch (error) {
      console.error('Error during bulk delete:', error)
      toast.error('Failed to delete activity logs', { id: toastId })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const filters: { key: FilterType; label: string; dot?: string }[] = [
    { key: 'all', label: 'All Activity' },
    { key: 'created', label: 'Created', dot: 'bg-emerald-500' },
    { key: 'edited', label: 'Edited', dot: 'bg-blue-500' },
    { key: 'deleted', label: 'Deleted', dot: 'bg-rose-500' },
  ]

  return (
    <div className={`rounded-xl border overflow-hidden ${
      darkMode ? 'bg-[#121214] border-[#27272a]' : 'bg-white border-gray-200'
    }`}>
      <div className={`px-4 sm:px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
            }`}>{filtered.length.toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuperUser && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isSelectMode) {
                      setIsSelectMode(false)
                      setSelectedIds(new Set())
                    } else {
                      setIsSelectMode(true)
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelectMode
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : darkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelectMode ? 'Cancel Select' : 'Select'}
                </button>

                {isSelectMode && selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedIds.size})</span>
                  </button>
                )}
              </>
            )}

            {/* Search Input Bar */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm flex-1 sm:flex-initial ${
              darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              <Search className="w-3.5 h-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`bg-transparent outline-none text-xs w-full sm:w-32 placeholder:text-gray-400 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center flex-wrap gap-1.5 mt-3">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
                filter === f.key
                  ? darkMode
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-900 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile View: Continuous Connecting Timeline View (Visible on mobile, hidden on desktop) */}
      <div className="md:hidden p-4 relative">
        {visibleEntries.length === 0 ? (
          <div className={`text-center py-10 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No activity found
          </div>
        ) : (
          <div className="relative">
            {/* Continuous Vertical Connecting Line */}
            <div className={`absolute left-[13px] top-3 bottom-3 w-0.5 ${
              darkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`} />

            <div className="space-y-4">
              {visibleEntries.map((entry) => {
                const cat = categorize(entry)
                const dt = formatDateTime(entry.createdAt)
                const avatarUrl = getUserAvatarUrl(entry.userName)
                const isSelected = selectedIds.has(entry.id)

                return (
                  <div
                    key={entry.id}
                    className={`relative flex items-start gap-3 rounded-xl p-2 transition-colors ${
                      isSelected
                        ? darkMode ? 'bg-blue-900/20' : 'bg-blue-50/60'
                        : darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {isSuperUser && isSelectMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(entry.id)}
                        className="mt-1.5 w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer shrink-0 z-10"
                      />
                    )}

                    {/* Timeline Avatar Node (Sits directly on the connecting vertical line) */}
                    <div className={`relative shrink-0 z-10 rounded-full p-0.5 ${
                      darkMode ? 'bg-[#121214] ring-2 ring-[#121214]' : 'bg-white ring-2 ring-white'
                    }`}>
                      <img
                        src={avatarUrl}
                        alt={entry.userName}
                        className="w-6 h-6 rounded-full bg-sky-100 object-cover border border-sky-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Timeline Content Block */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* Header Row: User, Action Badges & Time */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {entry.userName}
                          </span>
                          <ActionBadge category={cat} darkMode={darkMode} />
                          <TargetBadge target={entry.target || entry.targetName} darkMode={darkMode} />
                        </div>
                        <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {dt.line2}
                        </span>
                      </div>

                      {/* Description Text - Fully Wrapped, No Truncation */}
                      <p className={`text-xs leading-relaxed break-words font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {entry.description}
                      </p>

                      {/* Date Subtext */}
                      <div className={`text-[10px] font-medium mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {dt.line1}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop View: Full Table (Hidden on mobile, visible on tablet/desktop) */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[10px] uppercase tracking-wider ${
              darkMode ? 'text-gray-500 border-b border-gray-800' : 'text-gray-400 border-b border-gray-100'
            }`}>
              {/* Checkbox Column header when in Select Mode (SUPERUSER only) */}
              {isSuperUser && isSelectMode && (
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-5 py-2.5 font-semibold w-1/2">Description</th>
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-4 py-2.5 font-semibold">Date & Time</th>
              <th className="px-4 py-2.5 font-semibold">Target</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.length === 0 ? (
              <tr>
                <td colSpan={isSuperUser && isSelectMode ? 6 : 5} className={`text-center py-10 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No activity found
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry) => {
                const cat = categorize(entry)
                const dt = formatDateTime(entry.createdAt)
                const avatarUrl = getUserAvatarUrl(entry.userName)
                const isSelected = selectedIds.has(entry.id)

                return (
                  <tr key={entry.id} className={`border-b transition-colors ${
                    isSelected
                      ? darkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50/60 border-blue-100'
                      : darkMode ? 'border-gray-800/60 hover:bg-gray-800/30' : 'border-gray-50 hover:bg-gray-50/80'
                  }`}>
                    {/* Checkbox Cell when in Select Mode */}
                    {isSuperUser && isSelectMode && (
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(entry.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Description Column */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${
                          darkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <FileText className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                        
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-xs truncate max-w-md lg:max-w-xl ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                            {entry.description}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline shrink-0 whitespace-nowrap ml-1"
                          >
                            Lihat selengkapnya
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* User Column */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={avatarUrl}
                          alt={entry.userName}
                          className="w-6 h-6 rounded-full bg-sky-100 object-cover border border-sky-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className={`text-xs font-medium whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {entry.userName}
                        </span>
                      </div>
                    </td>

                    {/* Date & Time Column */}
                    <td className="px-4 py-3">
                      <div className={`text-xs leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="font-medium">{dt.line1}</div>
                        <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{dt.line2}</div>
                      </div>
                    </td>

                    {/* Target Column */}
                    <td className="px-4 py-3">
                      <TargetBadge target={entry.target || entry.targetName} darkMode={darkMode} />
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3">
                      <ActionBadge category={cat} darkMode={darkMode} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Unclipped Full Screen Modal Pop-up */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedEntry(null)}
          />

          <div className={`relative z-10 w-full max-w-lg p-5 rounded-2xl shadow-2xl border transition-all ${
            darkMode
              ? 'bg-[#18181b] border-gray-800 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-3 mb-3.5 ${
              darkMode ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Detail Aktivitas Lengkap</h3>
                  <span className="text-[10px] text-gray-400 font-medium">Log ID #{selectedEntry.id}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3.5">
              <div className={`p-4 rounded-xl border text-xs leading-relaxed font-semibold ${
                darkMode ? 'bg-gray-900/70 border-gray-800 text-gray-200' : 'bg-slate-50 border-slate-200/80 text-gray-800'
              }`}>
                {selectedEntry.description}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-[10px] text-gray-400 font-medium block mb-1">User</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={getUserAvatarUrl(selectedEntry.userName)}
                      alt={selectedEntry.userName}
                      className="w-5 h-5 rounded-full bg-sky-100 object-cover border border-sky-200"
                    />
                    <span className="font-semibold text-xs">{selectedEntry.userName}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-[10px] text-gray-400 font-medium block mb-1">Waktu & Tanggal</span>
                  <span className="font-semibold text-xs block">{formatDateTime(selectedEntry.createdAt).line1}</span>
                  <span className="text-[10px] text-gray-400">{formatDateTime(selectedEntry.createdAt).line2}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t flex justify-end border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedEntry(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          />

          <div className={`relative z-10 w-full max-w-md p-5 rounded-2xl shadow-2xl border transition-all ${
            darkMode ? 'bg-[#18181b] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Delete Activity Logs</h3>
                <span className="text-[11px] text-gray-400">Bulk Delete Confirmation</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-rose-500">{selectedIds.size}</strong> selected activity log(s)? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleBulkDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Log${selectedIds.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(RecentActivity);
