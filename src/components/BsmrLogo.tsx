// src/components/BsmrLogo.tsx

import React from 'react';
import BsmrLogoSvg from '../assets/bsmr-logo.svg';

interface BsmrLogoProps {
  collapsed?: boolean;
  darkMode?: boolean;
  className?: string;
}

const BsmrLogo: React.FC<BsmrLogoProps> = ({ collapsed = false, darkMode = false, className = '' }) => {
  // In dark mode: Make BSM white, keep R red
  // This is achieved by inverting colors (BSM blue->orange, R red->cyan) then using hue-rotate
  const logoStyle = darkMode
    ? {
        filter: 'brightness(0) invert(1) hue-rotate(180deg) saturate(2) brightness(1.3)',
        // brightness(0) = make all black
        // invert(1) = make all white
        // hue-rotate(180deg) = shift hues (red stays reddish)
        // saturate(2) = make red more vibrant
        // brightness(1.3) = brighten overall
      }
    : {};

  if (collapsed) {
    // Show compact logo when collapsed
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={BsmrLogoSvg}
          alt="BSMR Logo"
          className="w-12 h-12 object-contain flex-shrink-0"
          style={logoStyle}
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
        style={logoStyle}
      />
    </div>
  );
};

export default BsmrLogo;
