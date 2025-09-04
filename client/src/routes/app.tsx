import { useEffect, useState } from "react";
import { Header } from "../components/header/header.tsx";
import { Insights } from "../components/insights/insights.tsx";
import { api } from "../services/api.ts";
import styles from "./app.module.css";
import type { Insight } from "../schemas/insight.ts";

export const App = () => {
  const [insights, setInsights] = useState<Insight[]>([]); // Fixed: was Insight instead of Insight[]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiInsights = await api.fetchInsights();
      
      // Convert API insights to your app's Insight format
      const appInsights: Insight[] = apiInsights.map(apiInsight => ({
        id: apiInsight.id,
        brandId: apiInsight.brand,
        date: new Date(apiInsight.createdAt),
        text: apiInsight.text
      }));
      
      setInsights(appInsights);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights';
      setError(errorMessage);
      console.error('Error loading insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleInsightAdded = (newInsight: Insight) => {
    setInsights(prev => [newInsight, ...prev]);
    setError(null);
  };

  const handleInsightDeleted = (deletedId: number) => {
    setInsights(prev => prev.filter(insight => insight.id !== deletedId));
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const dismissError = () => {
    setError(null);
  };

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          font: 'var(--text-lg)',
          color: 'var(--color-text-light)'
        }}>
          Loading insights...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Header 
        onInsightAdded={handleInsightAdded}
        onError={handleError}
      />
      
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--size-4)',
          marginTop: 'var(--size-4)',
          color: '#991b1b',
          font: 'var(--text-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            type="button"
            onClick={dismissError}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'var(--text-xs)'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      <Insights 
        className={styles.insights} 
        insights={insights}
        onInsightDeleted={handleInsightDeleted}
        onError={handleError}
      />
    </main>
  );
};