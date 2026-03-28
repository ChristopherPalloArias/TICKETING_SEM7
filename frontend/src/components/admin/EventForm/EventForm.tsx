import { useState } from 'react';
import ImagePreview from '../ImagePreview/ImagePreview';
import type { EventFormProps, EventCreateFormData, RoomOption } from '../../../types/admin.types';
import styles from './EventForm.module.css';

const TAG_SUGGESTIONS = ['FEATURED PERFORMANCE', 'LIMITED SEATING'];

function toLocalDatetimeValue(date?: Date): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const NOW_PLUS_1H = toLocalDatetimeValue(new Date(Date.now() + 60 * 60 * 1000));

interface FormErrors {
  title?: string;
  description?: string;
  date?: string;
  capacity?: string;
  roomId?: string;
  duration?: string;
}

export default function EventForm({ rooms, onSubmit, isSubmitting, submitError }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(NOW_PLUS_1H);
  const [capacity, setCapacity] = useState('');
  const [roomId, setRoomId] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [director, setDirector] = useState('');
  const [castMembers, setCastMembers] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [tag, setTag] = useState('');
  const [isLimited, setIsLimited] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [author, setAuthor] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedRoom: RoomOption | undefined = rooms.find(r => r.id === roomId);

  function validateBusinessRules(): FormErrors {
    const errs: FormErrors = {};
    if (capacity && selectedRoom && Number(capacity) > selectedRoom.maxCapacity) {
      errs.capacity = `El aforo no puede exceder la capacidad de la sala (${selectedRoom.maxCapacity})`;
    }
    if (date && new Date(date) <= new Date()) {
      errs.date = 'La fecha debe ser posterior a la fecha actual';
    }
    if (duration && Number(duration) <= 0) {
      errs.duration = 'La duración debe ser mayor a 0 minutos';
    }
    return errs;
  }

  function validateAll(): FormErrors {
    const errs: FormErrors = { ...validateBusinessRules() };
    if (!title.trim()) errs.title = 'Este campo es obligatorio';
    if (!description.trim()) errs.description = 'Este campo es obligatorio';
    if (!date) errs.date = errs.date ?? 'Este campo es obligatorio';
    if (!capacity) errs.capacity = errs.capacity ?? 'Este campo es obligatorio';
    if (!roomId) errs.roomId = 'Este campo es obligatorio';
    return errs;
  }

  const businessErrors = validateBusinessRules();
  const hasBusinessErrors = Object.keys(businessErrors).length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const data: EventCreateFormData = {
      title: title.trim(),
      description: description.trim(),
      date,
      capacity: Number(capacity),
      roomId,
      subtitle: subtitle.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      director: director.trim() || undefined,
      castMembers: castMembers.trim() || undefined,
      duration: duration ? Number(duration) : undefined,
      location: location.trim() || undefined,
      tag: tag.trim() || undefined,
      isLimited,
      isFeatured,
      author: author.trim() || undefined,
    };
    await onSubmit(data);
  }

  const displayErrors = submitted ? errors : businessErrors;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.sectionTitle}>Información Básica</h2>

      <div className={styles.field}>
        <label htmlFor="ef-title" className={styles.label}>Título <span className={styles.required}>*</span></label>
        <input
          id="ef-title"
          className={`${styles.input} ${displayErrors.title ? styles.inputError : ''}`}
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={150}
        />
        {displayErrors.title && <span className={styles.error}>{displayErrors.title}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="ef-description" className={styles.label}>Descripción <span className={styles.required}>*</span></label>
        <textarea
          id="ef-description"
          className={`${styles.textarea} ${displayErrors.description ? styles.inputError : ''}`}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
        />
        {displayErrors.description && <span className={styles.error}>{displayErrors.description}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="ef-date" className={styles.label}>Fecha y Hora <span className={styles.required}>*</span></label>
          <input
            id="ef-date"
            type="datetime-local"
            className={`${styles.input} ${displayErrors.date ? styles.inputError : ''}`}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          {displayErrors.date && <span className={styles.error}>{displayErrors.date}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="ef-capacity" className={styles.label}>Aforo <span className={styles.required}>*</span></label>
          <input
            id="ef-capacity"
            type="number"
            min={1}
            className={`${styles.input} ${displayErrors.capacity ? styles.inputError : ''}`}
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
          />
          {displayErrors.capacity && <span className={styles.error}>{displayErrors.capacity}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="ef-room" className={styles.label}>Sala <span className={styles.required}>*</span></label>
        <select
          id="ef-room"
          className={`${styles.input} ${displayErrors.roomId ? styles.inputError : ''}`}
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        >
          <option value="">Selecciona una sala</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name} (máx. {r.maxCapacity})</option>
          ))}
        </select>
        {selectedRoom && (
          <span className={styles.hint}>Máximo: {selectedRoom.maxCapacity}</span>
        )}
        {displayErrors.roomId && <span className={styles.error}>{displayErrors.roomId}</span>}
      </div>

      <h2 className={styles.sectionTitle}>Metadata Artística</h2>

      <div className={styles.field}>
        <label htmlFor="ef-subtitle" className={styles.label}>Subtítulo</label>
        <input id="ef-subtitle" className={styles.input} value={subtitle} onChange={e => setSubtitle(e.target.value)} maxLength={300} />
      </div>

      <div className={styles.field}>
        <label htmlFor="ef-imageUrl" className={styles.label}>URL de Imagen</label>
        <input
          id="ef-imageUrl"
          className={styles.input}
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          onBlur={() => setImagePreviewUrl(imageUrl)}
          placeholder="https://..."
          maxLength={500}
        />
        {imagePreviewUrl && <ImagePreview url={imagePreviewUrl} />}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="ef-director" className={styles.label}>Director</label>
          <input id="ef-director" className={styles.input} value={director} onChange={e => setDirector(e.target.value)} maxLength={200} />
        </div>
        <div className={styles.field}>
          <label htmlFor="ef-cast" className={styles.label}>Elenco</label>
          <input id="ef-cast" className={styles.input} value={castMembers} onChange={e => setCastMembers(e.target.value)} maxLength={500} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="ef-duration" className={styles.label}>Duración (min)</label>
          <input
            id="ef-duration"
            type="number"
            min={1}
            className={`${styles.input} ${displayErrors.duration ? styles.inputError : ''}`}
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
          {displayErrors.duration && <span className={styles.error}>{displayErrors.duration}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor="ef-location" className={styles.label}>Ubicación</label>
          <input id="ef-location" className={styles.input} value={location} onChange={e => setLocation(e.target.value)} maxLength={300} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="ef-author" className={styles.label}>Autor</label>
          <input id="ef-author" className={styles.input} value={author} onChange={e => setAuthor(e.target.value)} maxLength={200} />
        </div>
        <div className={styles.field}>
          <label htmlFor="ef-tag" className={styles.label}>Etiqueta</label>
          <input
            id="ef-tag"
            className={styles.input}
            list="tag-suggestions"
            value={tag}
            onChange={e => setTag(e.target.value)}
            maxLength={100}
          />
          <datalist id="tag-suggestions">
            {TAG_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.toggleLabel}>
          <input type="checkbox" checked={isLimited} onChange={e => setIsLimited(e.target.checked)} />
          Aforo Limitado
        </label>
        <label className={styles.toggleLabel}>
          <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
          Evento Destacado
        </label>
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting || hasBusinessErrors}
      >
        {isSubmitting ? 'Creando...' : 'Crear Evento'}
      </button>
    </form>
  );
}
