import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface MockDataNotificationProps {
  show: boolean;
  onDismiss: () => void;
}

export const MockDataNotification: React.FC<MockDataNotificationProps> = ({ show, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Using Demo Data
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Backend server is not available. The app is running with mock data for demonstration purposes.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:text-yellow-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage mock data notification
export const useMockDataNotification = () => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check if mock mode is enabled
    const checkMockMode = () => {
      // Listen for console logs indicating mock mode
      const originalLog = console.log;
      console.log = (...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('mock'))) {
          setShowNotification(true);
        }
        originalLog.apply(console, args);
      };

      // Set a timeout to show notification if we detect mock usage
      const timer = setTimeout(() => {
        // Check if any network errors occurred (which would trigger mock mode)
        const hasNetworkErrors = localStorage.getItem('mock_mode_enabled') === 'true';
        if (hasNetworkErrors) {
          setShowNotification(true);
        }
      }, 2000);

      return () => {
        console.log = originalLog;
        clearTimeout(timer);
      };
    };

    checkMockMode();
  }, []);

  const dismissNotification = () => {
    setShowNotification(false);
    localStorage.setItem('mock_notification_dismissed', 'true');
  };

  return {
    showNotification: showNotification && localStorage.getItem('mock_notification_dismissed') !== 'true',
    dismissNotification
  };
};