import React from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { 
    isConnected, 
    isRefreshing, 
    lastUpdate, 
    refreshData,
    isAutoRefreshEnabled,
    enableAutoRefresh,
    disableAutoRefresh
  } = useData();

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    if (isRefreshing) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConnectionStatusText = () => {
    if (!isConnected) return 'Offline';
    if (isRefreshing) return 'Syncing...';
    return 'Online';
  };

  const handleRefresh = async () => {
    if (!isRefreshing) {
      await refreshData();
    }
  };

  const toggleAutoRefresh = () => {
    if (isAutoRefreshEnabled) {
      disableAutoRefresh();
    } else {
      enableAutoRefresh();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className={`h-4 w-4 ${getConnectionStatusColor()}`} />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
          {getConnectionStatusText()}
        </span>
      </div>

      {/* Last Update Time */}
      {lastUpdate && (
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span className="text-xs">
            {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Manual Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`p-1 rounded-lg transition-colors ${
          isRefreshing 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Auto-refresh Toggle */}
      <button
        onClick={toggleAutoRefresh}
        className={`p-1 rounded-lg transition-colors ${
          isAutoRefreshEnabled
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
      >
        <RefreshCw 
          className={`h-4 w-4 ${isAutoRefreshEnabled ? '' : 'opacity-50'}`} 
        />
      </button>

      {/* Offline Warning */}
      {!isConnected && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">Backend offline</span>
        </div>
      )}
    </div>
  );
};