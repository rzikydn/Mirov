import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock } from 'lucide-react';

interface AvatarPickerModalProps {
  show: boolean;
  darkMode: boolean;
  currentAvatar: string;
  disabledAvatars: string[];
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

// Koleksi yang jauh lebih banyak dan desain dengan rambut & gender yang jelas (menggunakan avataaars style dari DiceBear)
// Ditambahkan parameter `mouth` dan `eyes` agar ekspresi selalu profesional/tersenyum dan tidak aneh.
const safeParams = '&mouth=default,smile,twinkle&eyes=default,happy,wink';

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

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  show,
  darkMode,
  currentAvatar,
  disabledAvatars,
  onSelect,
  onClose,
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`${
            darkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
          } rounded-2xl border shadow-2xl w-full max-w-2xl min-h-[50vh] max-h-[85vh] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Choose Avatar
              </h2>
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

          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
              {avatarOptions.map((avatar) => {
                const isSelected = currentAvatar === avatar.url;
                const isUsedByOther = disabledAvatars.includes(avatar.url) && !isSelected;

                return (
                  <button
                    key={avatar.id}
                    disabled={isUsedByOther}
                    onClick={() => {
                      if (!isUsedByOther) {
                        onSelect(avatar.url);
                        onClose();
                      }
                    }}
                    className={`relative w-full aspect-square rounded-full transition-all duration-200 ${
                      isSelected
                        ? 'ring-4 ring-blue-500 ring-offset-2 scale-105 z-10'
                        : isUsedByOther
                          ? 'opacity-40 cursor-not-allowed grayscale-[50%]'
                          : `hover:scale-110 hover:ring-4 hover:ring-blue-400/50 hover:ring-offset-2 cursor-pointer ${darkMode ? 'ring-offset-[#1a1a1a]' : 'ring-offset-white'}`
                    } ${darkMode ? 'ring-offset-[#1a1a1a]' : 'ring-offset-white'}`}
                    title={isUsedByOther ? 'Already used by someone else' : 'Select avatar'}
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
                      <div className="absolute inset-0 bg-gray-900/40 rounded-full flex items-center justify-center">
                        <div className="bg-gray-800/80 text-white rounded-full p-1.5 shadow-md">
                          <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                      </div>
                    )}
                  </button>
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
