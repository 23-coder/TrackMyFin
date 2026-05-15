import React from 'react';

interface TrackMyFinLogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero' | 'favicon';
  showText?: boolean;
  className?: string;
  animated?: boolean;
  variant?: 'default' | 'minimal' | 'icon-only';
}

const TrackMyFinLogo: React.FC<TrackMyFinLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  className = '',
  animated = false,
  variant = 'default'
}) => {
  const sizeConfig = {
    small: { width: 32, height: 32, fontSize: '14px', textMargin: '8px' },
    medium: { width: 48, height: 48, fontSize: '18px', textMargin: '12px' },
    large: { width: 64, height: 64, fontSize: '24px', textMargin: '16px' },
    hero: { width: 120, height: 120, fontSize: '32px', textMargin: '24px' },
    favicon: { width: 16, height: 16, fontSize: '10px', textMargin: '4px' }
  };

  const config = sizeConfig[size];
  const isMinimal = variant === 'minimal';
  const isIconOnly = variant === 'icon-only';

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo SVG */}
      <div className={`flex-shrink-0 ${animated ? 'hover:scale-110 transition-transform duration-300' : ''}`}>
        <svg 
          width={config.width} 
          height={config.height} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Enhanced Gradients and Effects */}
          <defs>
            {/* Main gradient - more sophisticated color scheme */}
            <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="30%" stopColor="#3B82F6" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            
            {/* Chart gradient with enhanced colors */}
            <linearGradient id={`chartGradient-${size}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="30%" stopColor="#3B82F6" />
              <stop offset="70%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Inner glow effect */}
            <radialGradient id={`innerGlow-${size}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="80%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.9" />
            </radialGradient>

            {/* Glow effect for animated version */}
            {animated && (
              <filter id={`glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            )}

            {/* Drop shadow */}
            <filter id={`shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
            </filter>
          </defs>

          {/* Outer Ring with enhanced styling */}
          <circle 
            cx="60" 
            cy="60" 
            r="58" 
            fill={`url(#gradient-${size})`} 
            className={animated ? 'animate-pulse' : ''}
            filter={animated ? `url(#glow-${size})` : `url(#shadow-${size})`}
          />
          
          {/* Inner Circle with radial gradient */}
          <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill={isMinimal ? 'white' : `url(#innerGlow-${size})`} 
          />
          
          {/* Tech Rings - only show in default variant */}
          {!isMinimal && (
            <>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="0.8" strokeDasharray="4,2" opacity="0.6" />
              <circle cx="60" cy="60" r="35" fill="none" stroke="#D1D5DB" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.4" />
            </>
          )}

          {/* Chart Bars - Enhanced design */}
          {!isIconOnly && (
            <>
              <rect x="28" y="78" width="6" height="17" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="38" y="73" width="6" height="22" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="48" y="68" width="6" height="27" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="58" y="63" width="6" height="32" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="68" y="58" width="6" height="37" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="78" y="53" width="6" height="42" fill={`url(#chartGradient-${size})`} rx="3" />
              <rect x="88" y="48" width="6" height="47" fill={`url(#chartGradient-${size})`} rx="3" />
            </>
          )}

          {/* Currency Symbol (₹) - Enhanced positioning */}
          <text 
            x="32" 
            y="48" 
            fontFamily="Arial, sans-serif" 
            fontSize={isMinimal ? "16" : "18"} 
            fontWeight="bold" 
            fill="#059669"
            opacity={isIconOnly ? "0.8" : "1"}
          >
            ₹
          </text>

          {/* Upward Arrow - Enhanced design */}
          <g transform="translate(75, 40)">
            <path 
              d="M 0 8 L 8 0 L 5 3 L 5 -4 L 11 -4 L 11 3 L 8 0 L 16 8" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="2.8" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M 8 0 L 3 5 L 13 5 Z" fill="#10B981" />
          </g>

          {/* Tech Dots - Only show in default variant */}
          {!isMinimal && !isIconOnly && (
            <>
              <circle cx="25" cy="28" r="1.8" fill="#3B82F6" opacity="0.8" />
              <circle cx="95" cy="23" r="1.3" fill="#059669" opacity="0.7" />
              <circle cx="103" cy="68" r="1.8" fill="#1D4ED8" opacity="0.9" />
              <circle cx="17" cy="63" r="1.3" fill="#10B981" opacity="0.6" />
              <circle cx="42" cy="17" r="1.3" fill="#3B82F6" opacity="0.7" />
              <circle cx="78" cy="103" r="1.8" fill="#059669" opacity="0.8" />
            </>
          )}

          {/* Connection Lines - Subtle network effect */}
          {!isMinimal && !isIconOnly && (
            <>
              <path 
                d="M 25 28 Q 42 18 60 25" 
                fill="none" 
                stroke="#E5E7EB" 
                strokeWidth="0.8" 
                opacity="0.4"
              />
              <path 
                d="M 95 23 Q 85 38 75 43" 
                fill="none" 
                stroke="#E5E7EB" 
                strokeWidth="0.8" 
                opacity="0.4"
              />
            </>
          )}
        </svg>
      </div>

      {/* Text Logo - Enhanced typography */}
      {showText && !isIconOnly && (
        <div 
          className={`font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-green-600 bg-clip-text text-transparent tracking-tight ${
            size === 'hero' ? 'font-black' : 'font-bold'
          }`}
          style={{ 
            fontSize: config.fontSize,
            marginLeft: config.textMargin,
            letterSpacing: size === 'small' ? '0.02em' : '0.01em'
          }}
        >
          {size === 'small' ? 'TMF' : 'TrackMyFin'}
        </div>
      )}
    </div>
  );
};

export default TrackMyFinLogo;