// src/components/BsmrLogo.tsx

import React from 'react';
import BsmrLogoSvg from '../assets/bsmr-logo.svg';

interface BsmrLogoProps {
  collapsed?: boolean;
  darkMode?: boolean;
  className?: string;
}

const BsmrLogo: React.FC<BsmrLogoProps> = ({ collapsed = false, darkMode = false, className = '' }) => {
  if (collapsed) {
    // Show compact logo when collapsed
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={BsmrLogoSvg}
          alt="BSMR Logo"
          className="w-12 h-12 object-contain flex-shrink-0"
        />
      </div>
    );
  }

  // Show full logo when expanded
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={BsmrLogoSvg}
        alt="BSMR Logo"
        className="w-32 h-auto object-contain flex-shrink-0"
      />
    </div>
  );
};

export default BsmrLogo;
