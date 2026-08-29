import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, AtSign } from 'lucide-react';

import Char3 from '../assets/Char3svgh.svg';
import bsmrLogo from '../assets/bsmr-logo.svg';

interface LoginTransitionOverlayProps {
  username?: string;
  isOffline?: boolean;
  onComplete: () => void;
}

export default function LoginTransitionOverlay({
  username = 'superuser',
  isOffline = false,
  onComplete,
}: LoginTransitionOverlayProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      initial={{ y: '0%', opacity: 1 }}
      animate={{
        y: '-105%',
        opacity: [1, 1, 0.7, 0],
      }}
      transition={{
        duration: 1.3,
        ease: [0.32, 0.72, 0, 1], // gentle start with buttery-smooth cinematic deceleration
        opacity: {
          duration: 1.3,
          times: [0, 0.7, 0.9, 1],
          ease: 'linear',
        },
      }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden select-none will-change-transform shadow-[0_25px_60px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row items-stretch lg:items-center justify-start px-0 lg:px-0 md:px-16 bg-[#0066FF] lg:bg-transparent lg:bg-cover lg:bg-center lg:bg-no-repeat"
      style={isMobile ? {} : { backgroundImage: 'url(/BMSR.svg)' }}
    >

      {/* Success notification banner at the top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-fit max-w-[90vw] gap-4 border rounded-xl px-4 py-2.5 shadow-lg shadow-black/5 bg-[#E8F8F0] border-[#A2E0C1]">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="font-jakarta font-medium text-[13px] sm:text-[14px] whitespace-nowrap text-[#065F46]">
            {isOffline ? 'Offline Login successful! (Offline Mode)' : 'Login successful!'}
          </span>
        </div>
      </div>

      {/* Mobile Header Banner: Top illustration spacer */}
      {isMobile && (
        <div className="w-full pt-10 pb-6 flex flex-col items-center justify-center" />
      )}

      {/* Left Side: Character Illustration */}
      <div className="hidden lg:flex w-[50vw] items-center justify-end overflow-visible pr-8 xl:pr-16">
        <img
          src={Char3}
          alt="Illustration"
          className="max-h-[85vh] w-auto max-w-[95%] object-contain select-none pointer-events-none transform lg:translate-y-2 lg:translate-x-10 xl:translate-x-14"
        />
      </div>

      {/* Right Side: Form card container */}
      <div className="w-full lg:w-[50vw] flex flex-col justify-center bg-white lg:bg-transparent rounded-t-[40px] px-6 lg:px-12 xl:px-24 pt-8 pb-12 lg:pb-0 flex-1 transform lg:-translate-y-8">
        <div className="w-full max-w-[450px] mx-auto flex flex-col justify-center">
          {/* Header Texts */}
          <div className="text-left lg:text-right mb-6">
            <div className="flex justify-start lg:justify-end mb-1.5">
              <img
                src={bsmrLogo}
                alt="BSMR Logo"
                className="h-10 w-auto select-none pointer-events-none"
              />
            </div>
            <h1 className="font-montserrat text-2xl lg:text-[36px] font-extrabold text-[#0066FF] tracking-tight leading-none">
              Welcome
            </h1>
            <p className="font-lora text-xl lg:text-2xl text-[#FF725E] mt-1 lg:mt-0.5 font-medium italic leading-none">
              Lets Get Started Now!
            </p>
            <p className="font-jakarta text-[13px] text-gray-500 mt-4 font-normal leading-relaxed max-w-[440px] ml-0 lg:ml-auto">
              Securely sign in to track real time operational workflows, monitor systemic database, and manage institutional risk management certification programs.
            </p>
          </div>

          <div className="space-y-6">
            {/* User Input */}
            <div className="relative">
              <div className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm flex items-center">
                {username || 'superuser'}
              </div>
              <span className="absolute left-3.5 top-0 -translate-y-1/2 text-xs bg-white px-1.5 text-[#FF725E] font-jakarta">
                User
              </span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <AtSign className="w-5 h-5" />
              </span>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm flex items-center tracking-widest text-base">
                ••••••••••••
              </div>
              <span className="absolute left-3.5 top-0 -translate-y-1/2 text-xs bg-white px-1.5 text-[#FF725E] font-jakarta">
                Password
              </span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-start pl-1 mt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="w-4 h-4 rounded border-gray-300 text-[#0066FF] accent-[#0066FF]"
                />
                <span className="text-xs text-gray-500 font-jakarta">
                  Remember Me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="w-full bg-[#FF725E] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-[#FF725E]/20 mt-2 flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          </div>

          <p className="text-[11px] text-gray-400 font-jakarta text-center mt-6 select-none">
            © 2026 BSMR. All rights reserved.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
