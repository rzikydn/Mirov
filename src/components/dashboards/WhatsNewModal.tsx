import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Sun, ListChecks, Save } from 'lucide-react';

interface WhatsNewModalProps {
    darkMode: boolean;
    onClose: () => void;
    initialSlide?: number;
    onDontShowAgain?: () => void;
}

const slides = [
    {
        icon: Calendar,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        illustrationBg: 'bg-blue-50',
        title: 'New date picker design',
        description: 'Tampilan date picker yang baru dengan desain modern dan interaksi yang lebih nyaman untuk memilih tanggal.',
        image: '/images/datePicker.png', // Tambahkan URL gambar di sini, contoh: '/images/update-1.png'
    },
    {
        icon: Users,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        illustrationBg: 'bg-green-50',
        title: 'New History User Design',
        description: 'Riwayat aktivitas pengguna kini ditampilkan dengan timeline yang rapi dan mudah dibaca.',
        image: '/images/historyUser.png',
    },
    {
        icon: Sun,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        illustrationBg: 'bg-amber-50',
        title: 'Update Dark/Light Mode',
        description: 'Penampilan mode gelap dan terang telah diperbarui agar lebih konsisten dan nyaman di mata.',
        image: '/images/newDarkMode.png',
    },
    {
        icon: ListChecks,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        illustrationBg: 'bg-purple-50',
        title: 'New Data Type Status',
        description: 'Tipe data baru "Status" memungkinkan Anda melacak progres item dengan label berwarna.',
    },
    {
        icon: Save,
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        illustrationBg: 'bg-rose-50',
        title: 'Save & Refresh Feature',
        description: 'Fitur simpan dan refresh data yang baru untuk memastikan data Anda selalu sinkron.',
    },
];

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ darkMode, onClose, initialSlide = 0, onDontShowAgain }) => {
    const [currentSlide, setCurrentSlide] = useState(initialSlide);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain && onDontShowAgain) {
            onDontShowAgain();
        }
        onClose();
    };

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const current = slides[currentSlide];
    const IconComponent = current.icon;

    return (
        <motion.div
            className="fixed inset-0 z-[100000] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={
                    'relative w-[90vw] max-w-[640px] rounded-2xl shadow-2xl overflow-hidden ' +
                    (darkMode ? 'bg-[#2a2a2a] border border-gray-700' : 'bg-white')
                }
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className={
                        'absolute top-3 right-3 z-10 p-1.5 rounded-full transition-colors ' +
                        (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                    }
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex flex-col sm:flex-row min-h-[320px]">
                    {/* Left side - Text */}
                    <div className="flex-1 p-8 flex flex-col justify-between">
                        <div className="flex-1 flex flex-col relative">
                            <p className={'text-xs font-medium mb-4 tracking-wide uppercase ' + (darkMode ? 'text-gray-500' : 'text-gray-400')}>
                                Apa saja yang baru..
                            </p>

                            <div className="relative flex-1 min-h-[180px]">
                                <AnimatePresence>
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' } }}
                                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                        className="absolute inset-0 top-0 left-0 w-full"
                                    >
                                        {/* Icon */}
                                        <div className={'w-12 h-12 rounded-xl flex items-center justify-center mb-5 ' + current.iconBg}>
                                            <IconComponent className={'w-6 h-6 ' + current.iconColor} />
                                        </div>

                                        {/* Title */}
                                        <h2 className={
                                            'text-xl font-bold mb-3 ' +
                                            (darkMode ? 'text-white' : 'text-gray-900')
                                        }>
                                            {current.title}
                                        </h2>

                                        {/* Description */}
                                        <p className={
                                            'text-sm leading-relaxed ' +
                                            (darkMode ? 'text-gray-400' : 'text-gray-500')
                                        }>
                                            {current.description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Bottom controls */}
                        <div className="flex items-center justify-between mt-auto pt-8">
                            {/* Dots */}
                            <div className="flex items-center gap-2">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={
                                            'w-2 h-2 rounded-full transition-all duration-300 ' +
                                            (idx === currentSlide
                                                ? (darkMode ? 'bg-white w-4' : 'bg-gray-800 w-4')
                                                : (darkMode ? 'bg-gray-600' : 'bg-gray-300'))
                                        }
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                {currentSlide > 0 && (
                                    <button
                                        onClick={handlePrev}
                                        className={
                                            'px-4 py-2 text-sm rounded-lg transition-colors ' +
                                            (darkMode
                                                ? 'text-gray-300 hover:bg-gray-700'
                                                : 'text-gray-600 hover:bg-gray-100')
                                        }
                                    >
                                        Kembali
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className={
                                        'px-5 py-2 text-sm font-medium rounded-lg transition-colors ' +
                                        (darkMode
                                            ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200')
                                    }
                                >
                                    {currentSlide < slides.length - 1 ? 'Berikutnya' : 'Mulai'}
                                </button>
                            </div>
                        </div>

                        {/* Don't show again checkbox */}
                        <div className="mt-4">
                            <label className={'flex items-center gap-2 cursor-pointer select-none ' + (darkMode ? 'text-gray-400' : 'text-gray-500')}>
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 accent-gray-600"
                                />
                                <span className="text-xs">Jangan tampilkan lagi</span>
                            </label>
                        </div>
                    </div>

                    {/* Right side - Illustration area */}
                    <div className="hidden sm:flex w-[240px] relative overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                        <AnimatePresence>
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                                className={'absolute inset-0 w-full h-full flex flex-col items-center justify-center ' + (current.image ? '' : `gap-4 ${current.illustrationBg}`)}
                            >
                                {current.image ? (
                                    <img
                                        src={current.image}
                                        alt={current.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <>
                                        {/* Decorative illustration */}
                                        <div className={'w-20 h-20 rounded-2xl flex items-center justify-center ' + current.iconBg}>
                                            <IconComponent className={'w-10 h-10 ' + current.iconColor} />
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5 px-4 w-full">
                                            <div className={'h-1.5 w-20 rounded-full ' + current.iconBg} />
                                            <div className={'h-1.5 w-14 rounded-full ' + current.iconBg} />
                                            <div className={'h-1.5 w-16 rounded-full ' + current.iconBg} />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div >
    );
};

export default WhatsNewModal;
