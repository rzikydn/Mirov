// src/components/dashboards/modals/AvatarPickerModal.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';

interface AvatarPickerModalProps {
  show: boolean;
  darkMode: boolean;
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

// Avataaars-style avatars - Cartoon 3D with colorful backgrounds (Apple Memoji-like)
const avatarOptions = [
  { id: 1, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4' },
  { id: 2, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf' },
  { id: 3, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=d1d4f9' },
  { id: 4, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffd5dc' },
  { id: 5, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=c0aede' },
  { id: 6, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=b6e3f4' },
  { id: 7, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffdfbf' },
  { id: 8, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=d1d4f9' },
  { id: 9, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffd5dc' },
  { id: 10, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c0aede' },
  { id: 11, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella&backgroundColor=b6e3f4' },
  { id: 12, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&backgroundColor=ffdfbf' },
  { id: 13, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava&backgroundColor=d1d4f9' },
  { id: 14, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=ffd5dc' },
  { id: 15, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=c0aede' },
  { id: 16, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan&backgroundColor=b6e3f4' },
  { id: 17, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte&backgroundColor=ffdfbf' },
  { id: 18, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason&backgroundColor=d1d4f9' },
  { id: 19, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia&backgroundColor=ffd5dc' },
  { id: 20, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=c0aede' },
  { id: 21, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper&backgroundColor=b6e3f4' },
  { id: 22, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Logan&backgroundColor=ffdfbf' },
  { id: 23, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn&backgroundColor=d1d4f9' },
  { id: 24, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&backgroundColor=ffd5dc' },
];

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  show,
  darkMode,
  currentAvatar,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
        } rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose Avatar
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emoji..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-[#1a1a1a] text-gray-300 border-gray-700 placeholder-gray-600'
                  : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => {
                  onSelect(avatar.url);
                  onClose();
                }}
                className={`w-full aspect-square rounded-full overflow-hidden transition-all ${
                  currentAvatar === avatar.url
                    ? 'ring-4 ring-blue-500 scale-110'
                    : 'hover:scale-105'
                }`}
                title={`Avatar ${avatar.id}`}
              >
                <img
                  src={avatar.url}
                  alt={`Avatar ${avatar.id}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded text-sm font-medium ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AvatarPickerModal;
