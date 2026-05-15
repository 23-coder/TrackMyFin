import React, { useCallback, useEffect, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { tokenService } from '../../services/apiService';
import './SmartInsightsCard.css';

const INSIGHTS_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/api/dashboard/insights`;

const normalizeInsights = (data: unknown): string[] => {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (data && typeof data === 'object' && 'insights' in data) {
    const payload = (data as { insights?: unknown }).insights;
    if (Array.isArray(payload)) {
      return payload.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }

  return [];
};

interface TypingInsightItemProps {
  text: string;
  startDelay: number;
}

type InsightTone = 'good' | 'warning' | 'suggestion';

const GOOD_HINTS = ['saving', 'saved', 'on track', 'excellent', 'good', 'well done'];
const WARNING_HINTS = ['highest spending', 'overspend', 'debt', 'high expense', 'too much'];

const getInsightTone = (text: string): InsightTone => {
  const normalized = text.toLowerCase();

  if (WARNING_HINTS.some((hint) => normalized.includes(hint))) {
    return 'warning';
  }

  if (GOOD_HINTS.some((hint) => normalized.includes(hint))) {
    return 'good';
  }

  return 'suggestion';
};

const highlightInsightKeywords = (text: string): React.ReactNode[] => {
  const keywordPattern = /(highest spending|save|saving)/gi;
  const parts = text.split(keywordPattern);

  return parts.map((part, index) => {
    if (/^(highest spending|save|saving)$/i.test(part)) {
      return (
        <span key={`${part}-${index}`} className="smart-keyword-highlight">
          {part}
        </span>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const TypingInsightItem: React.FC<TypingInsightItemProps> = ({ text, startDelay }) => {
  const [typedText, setTypedText] = useState<string>('');
  const tone = getInsightTone(text);
  const isImportant = tone === 'warning';

  useEffect(() => {
    let charIndex = 0;
    let intervalId: number | undefined;

    const startTimeout = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        charIndex += 1;
        setTypedText(text.slice(0, charIndex));

        if (charIndex >= text.length && intervalId) {
          window.clearInterval(intervalId);
        }
      }, 16);
    }, startDelay);

    return () => {
      window.clearTimeout(startTimeout);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, startDelay]);

  return (
    <li
      className={`smart-insight-item smart-insight-fade-in smart-insight-${tone} text-gray-800 dark:text-gray-100 ${
        isImportant ? 'smart-insight-important' : ''
      }`}
    >
      <span className="smart-insight-icon" aria-hidden="true">
        👉
      </span>
      <span className="smart-insight-content">
        <span className="smart-insight-role">AI</span>
        <span className="smart-insight-typing-text">{highlightInsightKeywords(typedText)}</span>
      </span>
    </li>
  );
};

const SmartInsightsCard: React.FC = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [hasRequested, setHasRequested] = useState<boolean>(false);

  const fetchInsights = useCallback(async () => {
    setHasRequested(true);
    setIsLoading(true);
    setIsError(false);

    try {
      const token = tokenService.getToken();
      const response = await fetch(INSIGHTS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      setInsights(normalizeInsights(payload));
    } catch (error) {
      console.warn('Failed to fetch insights from backend:', error);
      setInsights([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <span className="smart-ai-title-icon" aria-hidden="true">
            <Bot className="h-4 w-4" />
          </span>
          <span>💡 Smart Insights</span>
        </h3>
        <button
          type="button"
          onClick={fetchInsights}
          className="smart-insights-refresh-btn"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>{hasRequested ? 'Refresh' : 'Show Insights'}</span>
        </button>
      </div>

      {!hasRequested && !isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-300">Click "Show Insights" to load your latest backend insights.</p>
      )}

      {hasRequested && isLoading && (
        <div className="smart-insights-thinking-state" aria-live="polite">
          <div className="smart-insights-thinking-text text-sm text-gray-600 dark:text-gray-300">
            <span>⏳ Generating insights</span>
            <span className="smart-insights-thinking-dots" aria-hidden="true">...</span>
          </div>

          <ul className="smart-insights-list" aria-hidden="true">
            {[1, 2, 3].map((item) => (
              <li key={item} className="smart-insight-skeleton-item">
                <span className="smart-insight-icon">👉</span>
                <span className="smart-insight-skeleton-line" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasRequested && !isLoading && isError && (
        <p className="text-sm text-red-600 dark:text-red-400">❌ Failed to load insights</p>
      )}

      {hasRequested && !isLoading && !isError && insights.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-300">No insights available</p>
      )}

      {hasRequested && !isLoading && !isError && insights.length > 0 && (
        <ul className="smart-insights-list">
          {insights.map((insight, index) => (
            <TypingInsightItem
              key={`${insight}-${index}`}
              text={insight}
              startDelay={index * 420}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default SmartInsightsCard;