// src/components/BsmrLogo.tsx

import React from 'react';

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
        <svg
          width="45"
          height="45"
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Red curved line at top - more accurate curve */}
          <path
            d="M 15,28 Q 60,12 105,28"
            stroke="#DC2626"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />

          {/* BSMR Text - Compact but clear */}
          <text
            x="60"
            y="80"
            fontFamily="'Arial Black', 'Arial', sans-serif"
            fontSize="38"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="-1"
          >
            <tspan fill="#00205B">BSM</tspan>
            <tspan fill="#DC2626">R</tspan>
          </text>
        </svg>
      </div>
    );
  }

  // Show full logo when expanded
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width="150"
        height="65"
        viewBox="0 0 320 130"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Red curved line at top - matching original logo */}
        <path
          d="M 30,30 Q 160,8 290,30"
          stroke="#DC2626"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* BSMR Text - Bold and prominent */}
        <text
          x="160"
          y="105"
          fontFamily="'Arial Black', 'Arial', sans-serif"
          fontSize="85"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="3"
        >
          <tspan fill="#00205B">B</tspan>
          <tspan fill="#00205B">S</tspan>
          <tspan fill="#00205B">M</tspan>
          <tspan fill="#DC2626">R</tspan>
        </text>
      </svg>
    </div>
  );
};

export default BsmrLogo;
