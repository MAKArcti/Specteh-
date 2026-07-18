/** WGS84 coordinate pair. Matches the shape stored in PostGIS geography columns. */
export interface GeoPoint {
  lat: number;
  lng: number;
}
