import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock, AlertCircle } from 'lucide-react';

interface TakenAvatar {
  userId: number;
  name: string;
  avatar: string;
}

interface AvatarPickerModalProps {
  show: boolean;
  darkMode: boolean;
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const avatarOptions = [
  // --- Avatars (Pilihan Cewek) ---
  { id: 1, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine&backgroundColor=ffd5dc${safeParams}` },
  { id: 2, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf${safeParams}` },
  { id: 3, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=d1d4f9${safeParams}` },
  { id: 4, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=b6e3f4${safeParams}` },
  { id: 5, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Alice&backgroundColor=c0aede${safeParams}` },
  { id: 6, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc${safeParams}` },
  { id: 7, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffdfbf${safeParams}` },
  { id: 8, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Hazel&backgroundColor=b6e3f4${safeParams}` },
  { id: 9, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=c0aede${safeParams}` },
  { id: 10, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy&backgroundColor=d1d4f9${safeParams}` },
  { id: 11, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Jade&backgroundColor=ffdfbf${safeParams}` },
  { id: 12, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Kira&backgroundColor=ffd5dc${safeParams}` },
  { id: 13, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Nora&backgroundColor=b6e3f4${safeParams}` },
  { id: 14, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=d1d4f9${safeParams}` },
  { id: 15, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia&backgroundColor=ffd5dc${safeParams}` },
  { id: 16, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona&backgroundColor=c0aede${safeParams}` },

  // --- Avatars (Pilihan Cowok) ---
  { id: 17, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Adam&backgroundColor=b6e3f4${safeParams}` },
  { id: 18, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c0aede${safeParams}` },
  { id: 19, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Brian&backgroundColor=ffdfbf${safeParams}` },
  { id: 20, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d1d4f9${safeParams}` },
  { id: 21, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&backgroundColor=b6e3f4${safeParams}` },
  { id: 22, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mason&backgroundColor=c0aede${safeParams}` },
  { id: 23, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&backgroundColor=ffdfbf${safeParams}` },
  { id: 24, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=d1d4f9${safeParams}` },
  { id: 25, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan&backgroundColor=b6e3f4${safeParams}` },
  { id: 26, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Paul&backgroundColor=ffd5dc${safeParams}` },
  { id: 27, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede${safeParams}` },
  { id: 28, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar&backgroundColor=d1d4f9${safeParams}` },
  { id: 29, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Gavin&backgroundColor=ffdfbf${safeParams}` },
  { id: 30, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin&backgroundColor=b6e3f4${safeParams}` },
  { id: 31, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Henry&backgroundColor=ffd5dc${safeParams}` },
  { id: 32, url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Isaac&backgroundColor=c0aede${safeParams}` },
];

const checkAvatarMatch = (optionUrl: string, targetAvatarUrl?: string | null): boolean => {
  if (!targetAvatarUrl) return false;
  if (optionUrl === targetAvatarUrl) return true;
  try {
    const u1 = new URL(optionUrl);
    const u2 = new URL(targetAvatarUrl);
    const seed1 = u1.searchParams.get('seed');
    const seed2 = u2.searchParams.get('seed');
    return Boolean(seed1 && seed2 && seed1.toLowerCase() === seed2.toLowerCase());
  } catch {
    return false;
  }
};

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  show,
  darkMode,
  currentAvatar,
  onSelect,
  onClose,
}) => {
  const [takenAvatars, setTakenAvatars] = useState<TakenAvatar[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const fetchTakenAvatars = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/avatars`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setTakenAvatars(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching taken avatars:', err);
    }
  };

  useEffect(() => {
    if (show) {
      setErrorMsg(null);
      fetchTakenAvatars();
    }
  }, [show]);

  if (!show) return null;

  const handleChooseAvatar = async (selectedUrl: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarUrl: selectedUrl })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.data && result.data.user) {
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }

        onSelect(selectedUrl);
        window.dispatchEvent(new Event('userAvatarUpdated'));
        onClose();
      } else {
        setErrorMsg(result.message || 'Avatar is locked or taken');
      }
    } catch (err) {
      console.error('Error saving avatar:', err);
      setErrorMsg('Failed to update avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`${
            darkMode ? 'bg-[#1a1a1a] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          } rounded-2xl border shadow-2xl w-full max-w-2xl min-h-[50vh] max-h-[85vh] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div>
              <h2 className="text-lg font-bold">Choose Avatar</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Select a profile picture. Avatars used by other users are locked.
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="px-6 pt-3">
              <div className="bg-red-500/15 border border-red-500/30 text-red-500 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
              {avatarOptions.map((avatar) => {
                const isSelected = checkAvatarMatch(avatar.url, currentAvatar);
                const takenUser = takenAvatars.find(
                  (t) => checkAvatarMatch(avatar.url, t.avatar) && t.userId !== currentUser?.id
                );
                const isUsedByOther = Boolean(takenUser);

                return (
                  <div key={avatar.id} className="relative group/avatar flex flex-col items-center">
                    <button
                      disabled={isUsedByOther || saving}
                      onClick={() => !isUsedByOther && handleChooseAvatar(avatar.url)}
                      className={`relative w-full aspect-square rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'ring-4 ring-blue-500 ring-offset-2 scale-105 z-10'
                          : isUsedByOther
                            ? 'opacity-40 cursor-not-allowed grayscale-[60%]'
                            : `hover:scale-110 hover:ring-4 hover:ring-blue-400/50 hover:ring-offset-2 cursor-pointer ${
                                darkMode ? 'ring-offset-[#1a1a1a]' : 'ring-offset-white'
                              }`
                      } ${darkMode ? 'ring-offset-[#1a1a1a]' : 'ring-offset-white'}`}
                      title={isUsedByOther ? `Taken by ${takenUser?.name}` : 'Select avatar'}
                    >
                      <img
                        src={avatar.url}
                        alt={`Avatar ${avatar.id}`}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />

                      {/* Selected Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full p-1 shadow-md">
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      {/* Locked Overlay */}
                      {isUsedByOther && (
                        <div className="absolute inset-0 bg-gray-900/50 rounded-full flex items-center justify-center">
                          <div className="bg-gray-900/90 text-white rounded-full p-1.5 shadow-md">
                            <Lock className="w-3.5 h-3.5 text-gray-300" strokeWidth={2.5} />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Tooltip on hover if taken */}
                    {isUsedByOther && (
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 whitespace-nowrap bg-gray-900 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-lg">
                        Taken by {takenUser?.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvatarPickerModal;
