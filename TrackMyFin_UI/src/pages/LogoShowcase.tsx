import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import LogoShowcaseComponent from '../components/ui/LogoShowcase';

const LogoShowcase: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen py-12 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4">
        <LogoShowcaseComponent />
      </div>
    </div>
  );
};

export default LogoShowcase;