// Adoni, Andhra Pradesh, India (town centre).
export const ADONI_LOCATION = { latitude: 15.62788, longitude: 77.27495 };

export function validLocation(location) {
  return location != null && typeof location.latitude === 'number' && typeof location.longitude === 'number'
    && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
    && Math.abs(location.latitude) <= 90 && Math.abs(location.longitude) <= 180;
}

export function normalizeLocation(location) {
  if (!validLocation(location)) throw new Error('Please select your delivery location on the map.');
  return { latitude: Number(location.latitude.toFixed(6)), longitude: Number(location.longitude.toFixed(6)) };
}

export function locationLink(location) {
  const point = normalizeLocation(location);
  return `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
}
