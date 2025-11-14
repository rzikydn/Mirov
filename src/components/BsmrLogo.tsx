// src/components/BsmrLogo.tsx

import React from 'react';

interface BsmrLogoProps {
  collapsed?: boolean;
  darkMode?: boolean;
  className?: string;
}

const BsmrLogo: React.FC<BsmrLogoProps> = ({ collapsed = false, darkMode = false, className = '' }) => {
  if (collapsed) {
    // Show compact logo when collapsed (just the letters stacked or icon)
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Red curved line at top */}
          <path
            d="M 20,25 Q 50,15 80,25"
            stroke="#EF4444"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />

          {/* BSMR Text - Compact */}
          <text
            x="50"
            y="70"
            fontFamily="'Inter', 'Arial Black', sans-serif"
            fontSize="32"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="-2"
          >
            <tspan fill="#1E3A8A">BS</tspan>
            <tspan fill="#1E3A8A">M</tspan>
            <tspan fill="#EF4444">R</tspan>
          </text>
        </svg>
      </div>
    );
  }

  // Show full logo when expanded
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width="140"
        height="60"
        viewBox="0 0 280 120"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Red curved line at top */}
        <path
          d="M 40,30 Q 140,10 240,30"
          stroke="#EF4444"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        {/* BSMR Text */}
        <text
          x="140"
          y="95"
          fontFamily="'Inter', 'Arial Black', sans-serif"
          fontSize="70"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="2"
        >
          <tspan fill="#1E3A8A">B</tspan>
          <tspan fill="#1E3A8A">S</tspan>
          <tspan fill="#1E3A8A">M</tspan>
          <tspan fill="#EF4444">R</tspan>
        </text>
      </svg>
    </div>
  );
};

export default BsmrLogo;
