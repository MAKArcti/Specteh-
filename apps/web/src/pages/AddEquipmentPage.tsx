import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EquipmentType, type Equipment } from '@spectech/shared-types';
import { createEquipment } from '../api/equipment';
import { ApiError } from '../api/client';

const EQUIPMENT_TYPES = Object.values(EquipmentType);

export function AddEquipmentPage() {
  const [type, setType] = useState<EquipmentType>(EquipmentType.EXCAVATOR);
  const [label, setLabel] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Equipment | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const equipment = await createEquipment({
        type,
        label,
        pricePerHour: Number(pricePerHour),
        lat: Number(lat),
        lng: Number(lng),
      });
      setCreated(equipment);
      setLabel('');
      setPricePerHour('');
      setLat('');
      setLng('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add equipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Add equipment</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as EquipmentType)}>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} required />
        </label>
        <label>
          Price per hour
          <input
            type="number"
            min="0"
            step="0.01"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            required
          />
        </label>
        <label>
          Latitude
          <input
            type="number"
            min="-90"
            max="90"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            min="-180"
            max="180"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add equipment'}
        </button>
      </form>
      {created && (
        <p className="success">
          Added &quot;{created.label}&quot; (id {created.id}), status: {created.status}
        </p>
      )}
      <p>
        <Link to="/deals/mine">View my deals</Link>
      </p>
    </div>
  );
}
