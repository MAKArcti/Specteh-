import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { EquipmentType } from '@spectech/shared-types';
import { createRequest } from '../api/requests';
import { ApiError } from '../api/client';

const EQUIPMENT_TYPES = Object.values(EquipmentType);

export function CreateRequestPage() {
  const navigate = useNavigate();
  const [equipmentType, setEquipmentType] = useState<EquipmentType>(EquipmentType.EXCAVATOR);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [searchRadiusKm, setSearchRadiusKm] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const request = await createRequest({
        equipmentType,
        lat: Number(lat),
        lng: Number(lng),
        searchRadiusKm: Number(searchRadiusKm),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        notes: notes || undefined,
      });
      navigate(`/requests/${request.id}/offers`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create request');
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Create request</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Equipment type
          <select
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
          >
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
        <label>
          Search radius (km)
          <input
            type="number"
            min="1"
            max="200"
            value={searchRadiusKm}
            onChange={(e) => setSearchRadiusKm(e.target.value)}
            required
          />
        </label>
        <label>
          Start date
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label>
          End date
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Searching…' : 'Find equipment'}
        </button>
      </form>
    </div>
  );
}
