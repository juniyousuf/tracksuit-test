import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { cx } from "../../lib/cx.ts";
import { api } from "../../services/api.ts";
import styles from "./insights.module.css";
import type { Insight } from "../../schemas/insight.ts";

type InsightsProps = {
  insights: Insight[];
  className?: string;
  onInsightDeleted?: (deletedId: number) => void;
  onError?: (error: string) => void;
};

export const Insights = ({ 
  insights, 
  className, 
  onInsightDeleted,
  onError 
}: InsightsProps) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const deleteInsight = async (id: number) => {
    if (!id) return;
    
    setDeletingIds(prev => new Set([...prev, id]));
    
    try {
      await api.deleteInsight(id);
      onInsightDeleted?.(id);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete insight';
      onError?.(errorMessage);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    if (globalThis.confirm('Are you sure you want to delete this insight? This action cannot be undone.')) {
      deleteInsight(id);
    }
  };

  return (
    <div className={cx(className)}>
      <h1 className={styles.heading}>Insights</h1>
      <div className={styles.list}>
        {insights?.length
          ? (
            insights.map(({ id, text, date, brandId }) => (
              <div className={styles.insight} key={id}>
                <div className={styles["insight-meta"]}>
                  <span>Brand {brandId}</span>
                  <div className={styles["insight-meta-details"]}>
                    <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                    <Trash2Icon
                      className={cx(
                        styles["insight-delete"],
                        deletingIds.has(id) && styles["insight-delete-loading"]
                      )}
                      onClick={() => handleDeleteClick(id)}
                      style={{
                        opacity: deletingIds.has(id) ? 0.5 : 1,
                        cursor: deletingIds.has(id) ? 'not-allowed' : 'pointer'
                      }}
                    />
                  </div>
                </div>
                <p className={styles["insight-content"]}>{text}</p>
              </div>
            ))
          )
          : <p>We have no insights!</p>}
      </div>
    </div>
  );
};