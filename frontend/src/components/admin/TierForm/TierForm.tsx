import { useState } from 'react';
import { addTier } from '../../../services/adminEventService';
import { useAuth } from '../../../hooks/useAuth';
import type { TierFormProps, TierFormData, AdminTierResponse } from '../../../types/admin.types';
import styles from './TierForm.module.css';

type TierType = 'VIP' | 'GENERAL' | 'EARLY_BIRD';

export default function TierForm({
  eventId,
  eventCapacity,
  currentTotalQuota,
  onTierAdded,
  onCancel,
}: TierFormProps) {
  const { userId } = useAuth();
  const [tierType, setTierType] = useState<TierType>('VIP');
  const [price, setPrice] = useState('');
  const [quota, setQuota] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const priceNum = parseFloat(price);
  const quotaNum = parseInt(quota, 10);

  const priceError = price !== '' && (isNaN(priceNum) || priceNum <= 0)
    ? 'El precio debe ser mayor a $0'
    : null;

  const quotaError = quota !== '' && (isNaN(quotaNum) || quotaNum <= 0)
    ? 'El cupo debe ser mayor a 0'
    : null;

  const newTotal = currentTotalQuota + (isNaN(quotaNum) ? 0 : quotaNum);
  const capacityError =
    quota !== '' && !isNaN(quotaNum) && quotaNum > 0 && newTotal > eventCapacity
      ? `La suma de cupos (${newTotal}) excede el aforo del evento (${eventCapacity})`
      : null;

  const dateError =
    tierType === 'EARLY_BIRD' && validFrom && validUntil && validFrom >= validUntil
      ? 'La fecha de inicio debe ser anterior a la fecha de fin'
      : null;

  const earlyBirdIncomplete =
    tierType === 'EARLY_BIRD' && (!validFrom || !validUntil);

  const isValid =
    !priceError &&
    !quotaError &&
    !capacityError &&
    !dateError &&
    !earlyBirdIncomplete &&
    price !== '' &&
    quota !== '' &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    !isNaN(quotaNum) &&
    quotaNum > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !userId) return;

    const data: TierFormData = {
      tierType,
      price: priceNum,
      quota: quotaNum,
      ...(tierType === 'EARLY_BIRD' && { validFrom, validUntil }),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const newTier: AdminTierResponse = await addTier(eventId, data);
      onTierAdded(newTier);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ||
        'Error al agregar el tier. Intenta de nuevo.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.title}>Agregar Tier</h3>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tierType">
          Tipo *
        </label>
        <select
          id="tierType"
          className={styles.select}
          value={tierType}
          onChange={(e) => setTierType(e.target.value as TierType)}
        >
          <option value="VIP">VIP</option>
          <option value="GENERAL">GENERAL</option>
          <option value="EARLY_BIRD">EARLY BIRD</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="price">
          Precio *
        </label>
        <input
          id="price"
          type="number"
          className={`${styles.input} ${priceError ? styles.inputError : ''}`}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        {priceError && <span className={styles.errorText}>{priceError}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="quota">
          Cupo *
        </label>
        <input
          id="quota"
          type="number"
          className={`${styles.input} ${quotaError || capacityError ? styles.inputError : ''}`}
          placeholder="0"
          min="1"
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
        />
        {quotaError && <span className={styles.errorText}>{quotaError}</span>}
        {capacityError && <span className={styles.errorText}>{capacityError}</span>}
      </div>

      {tierType === 'EARLY_BIRD' && (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="validFrom">
              Fecha de inicio *
            </label>
            <input
              id="validFrom"
              type="datetime-local"
              className={`${styles.input} ${dateError ? styles.inputError : ''}`}
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="validUntil">
              Fecha de fin *
            </label>
            <input
              id="validUntil"
              type="datetime-local"
              className={`${styles.input} ${dateError ? styles.inputError : ''}`}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            {dateError && <span className={styles.errorText}>{dateError}</span>}
          </div>
        </>
      )}

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isValid || submitting}
        >
          {submitting ? 'Guardando...' : 'Guardar Tier'}
        </button>
      </div>
    </form>
  );
}
