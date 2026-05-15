import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ 
  size = 32, 
  className = '' 
}) => {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradients */}
        <defs>
          <linearGradient id={`appGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="30%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          
          <linearGradient id={`appChartGradient-${size}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <radialGradient id={`appInnerGlow-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="90%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* Outer circle */}
        <circle 
          cx="60" 
          cy="60" 
          r="58" 
          fill={`url(#appGradient-${size})`}
        />
        
        {/* Inner circle */}
        <circle 
          cx="60" 
          cy="60" 
          r="50" 
          fill={`url(#appInnerGlow-${size})`}
        />

        {/* Chart bars */}
        <rect x="30" y="78" width="5" height="17" fill={`url(#appChartGradient-${size})`} rx="2.5" />
        <rect x="40" y="73" width="5" height="22" fill={`url(#appChartGradient-${size})`} rx="2.5" />
        <rect x="50" y="68" width="5" height="27" fill={`url(#appChartGradient-${size})`} rx="2.5" />
        <rect x="60" y="63" width="5" height="32" fill={`url(#appChartGradient-${size})`} rx="2.5" />
        <rect x="70" y="58" width="5" height="37" fill={`url(#appChartGradient-${size})`} rx="2.5" />
        <rect x="80" y="53" width="5" height="42" fill={`url(#appChartGradient-${size})`} rx="2.5" />

        {/* Currency symbol */}
        <text 
          x="32" 
          y="48" 
          fontFamily="Arial, sans-serif" 
          fontSize="16" 
          fontWeight="bold" 
          fill="#059669"
        >
          ₹
        </text>

        {/* Upward arrow */}
        <g transform="translate(75, 40)">
          <path 
            d="M 0 8 L 8 0 L 5 3 L 5 -4 L 11 -4 L 11 3 L 8 0 L 16 8" 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 8 0 L 3 5 L 13 5 Z" fill="#10B981" />
        </g>
      </svg>
    </div>
  );
};

export default AppIcon;