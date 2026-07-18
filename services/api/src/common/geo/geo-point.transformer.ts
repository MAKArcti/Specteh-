import { GeoPoint } from '@spectech/shared-types';
import { ValueTransformer } from 'typeorm';

interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

/**
 * Converts between the app-facing `{ lat, lng }` shape and the GeoJSON Point
 * TypeORM reads/writes for a postgis `geography(Point,4326)` column.
 */
export const geoPointTransformer: ValueTransformer = {
  to: (value?: GeoPoint): GeoJsonPoint | undefined =>
    value ? { type: 'Point', coordinates: [value.lng, value.lat] } : undefined,
  from: (value?: GeoJsonPoint | string): GeoPoint | undefined => {
    if (!value) return undefined;
    const parsed = typeof value === 'string' ? (JSON.parse(value) as GeoJsonPoint) : value;
    const [lng, lat] = parsed.coordinates;
    return { lat, lng };
  },
};
