import { useState } from "react";
import { BRANDS } from "../../lib/consts.ts";
import { api, type CreateInsightData } from "../../services/api.ts";
import { Button } from "../button/button.tsx";
import { Modal, type ModalProps } from "../modal/modal.tsx";
import styles from "./add-insight.module.css";
import type { Insight } from "../../schemas/insight.ts";

type AddInsightProps = ModalProps & {
  onInsightAdded?: (insight: Insight) => void;
  onError?: (error: string) => void;
};

export const AddInsight = ({ 
  onInsightAdded, 
  onError, 
  onClose,
  ...modalProps 
}: AddInsightProps) => {
  const [formData, setFormData] = useState<CreateInsightData>({
    brand: BRANDS[0]?.id || 1,
    text: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      brand: BRANDS[0]?.id || 1,
      text: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      onError?.('Insight text is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newApiInsight = await api.createInsight(formData);
      
      // Convert the API response to match your Insight schema
      const newInsight: Insight = {
        id: newApiInsight.id,
        brandId: newApiInsight.brand,
        date: new Date(newApiInsight.createdAt),
        text: newApiInsight.text
      };
      
      onInsightAdded?.(newInsight);
      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create insight';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal {...modalProps} onClose={handleClose}>
      <h1 className={styles.heading}>Add a new insight</h1>
      <form className={styles.form} onSubmit={addInsight}>
        <label className={styles.field}>
          Brand
          <select 
            className={styles["field-input"]}
            value={formData.brand}
            onChange={(e) => setFormData({
              ...formData,
              brand: parseInt(e.target.value)
            })}
            disabled={isSubmitting}
          >
            {BRANDS.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Insight
          <textarea
            className={styles["field-input"]}
            rows={5}
            placeholder="Something insightful..."
            value={formData.text}
            onChange={(e) => setFormData({
              ...formData,
              text: e.target.value
            })}
            disabled={isSubmitting}
            maxLength={1000}
            required
          />
          <span style={{ 
            fontSize: 'var(--text-xs, 0.75rem)', 
            color: 'var(--color-text-light)',
            marginTop: 'var(--size-1, 0.25rem)'
          }}>
            {formData.text.length}/1000 characters
          </span>
        </label>
        <Button 
          className={styles.submit} 
          type="submit" 
          label={isSubmitting ? "Adding..." : "Add insight"}
          disabled={isSubmitting || !formData.text.trim()}
        />
      </form>
    </Modal>
  );
};