'use client';

import { useEffect, useRef, useState } from 'react';
import { ADONI_LOCATION, normalizeLocation } from '../lib/location';

export default function LocationPicker({ value, onChange }) {
  const container = useRef(null);
  const controls = useRef(null);
  const change = useRef(onChange);
  change.current = onChange;
  const initial = useRef(value);
  const alive = useRef(false);
  const revision = useRef(0);
  const [point, setPoint] = useState(value || ADONI_LOCATION);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState(value ? 'Your delivery pin is selected.' : 'Showing Adoni. Drag the pin or tap the map to choose your delivery location.');
  const [mapError, setMapError] = useState('');

  function locate() {
    if (!navigator.geolocation || !window.isSecureContext) {
      setNotice('Current location is unavailable. Please select your location on the map.');
      return;
    }
    const requestRevision = ++revision.current;
    setLocating(true);
    setNotice('Finding your current location… You can also select the pin yourself.');
    navigator.geolocation.getCurrentPosition(position => {
      if (!alive.current) return;
      setLocating(false);
      if (revision.current !== requestRevision) return;
      const next = normalizeLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      controls.current?.place(next, true);
      setNotice(`Current location selected (accuracy about ${Math.round(position.coords.accuracy)} metres). Adjust the pin if needed.`);
    }, error => {
      if (!alive.current) return;
      setLocating(false);
      if (revision.current !== requestRevision) return;
      setNotice(error.code === 1 ? 'Location permission is off. Drag the pin or tap the map to select your location.' : 'Could not find your current location. Please select your location on the map.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  useEffect(() => {
    alive.current = true;
    let disposed = false;
    const setupRevision = revision.current;
    let map;
    let observer;
    async function setup() {
      try {
        const { default: L } = await import('leaflet');
        if (disposed) return;
        const start = initial.current || ADONI_LOCATION;
        map = L.map(container.current, { scrollWheelZoom: false }).setView([start.latitude, start.longitude], initial.current ? 17 : 14);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        tiles.on('tileerror', () => { if (!disposed) setMapError('Some map tiles could not load. Check your internet connection or try again shortly.'); });
        const icon = L.divIcon({ className: 'delivery-pin', html: '<span aria-hidden="true">📍</span>', iconSize: [36, 44], iconAnchor: [18, 40] });
        const marker = L.marker([start.latitude, start.longitude], { icon, draggable: true, title: 'Delivery pin', alt: 'Delivery pin', keyboard: true }).addTo(map);
        function place(next, centre = false) {
          marker.setLatLng([next.latitude, next.longitude]);
          setPoint(next);
          change.current(next);
          if (centre) map.setView([next.latitude, next.longitude], 17);
        }
        function select(latlng) {
          revision.current++;
          const next = normalizeLocation({ latitude: Math.max(-90, Math.min(90, latlng.lat)), longitude: latlng.wrap().lng });
          place(next);
          setNotice('Delivery pin selected. You can move it again if needed.');
        }
        marker.on('dragstart', () => { revision.current++; });
        marker.on('dragend', () => select(marker.getLatLng()));
        map.on('click', event => select(event.latlng));
        marker.getElement().addEventListener('keydown', event => {
          const offsets = { ArrowUp: [0.0001, 0], ArrowDown: [-0.0001, 0], ArrowLeft: [0, -0.0001], ArrowRight: [0, 0.0001] };
          const delta = offsets[event.key];
          if (!delta) return;
          event.preventDefault(); event.stopPropagation();
          const current = marker.getLatLng();
          select(L.latLng(current.lat + delta[0], current.lng + delta[1]));
          map.panTo(marker.getLatLng());
        });
        controls.current = { place };
        observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(container.current);
        setReady(true);
        // Reuse an already granted permission without prompting on every checkout.
        if (!initial.current && navigator.permissions?.query) {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            if (!disposed && revision.current === setupRevision && permission.state === 'granted') locate();
          } catch { /* Browsers without permission queries can use the location button. */ }
        }
      } catch {
        if (!disposed) setMapError('The map could not load. Please reopen the delivery form to try again.');
      }
    }
    setup();
    return () => { disposed = true; alive.current = false; revision.current++; observer?.disconnect(); map?.remove(); controls.current = null; };
  }, []);

  return <section className="location-picker" aria-labelledby="delivery-location-label">
    <h3 id="delivery-location-label">Pin your delivery location</h3>
    <p className="location-help">Drag the pin or tap the map. You can also focus the pin and use the arrow keys.</p>
    <div ref={container} className="delivery-map" role="region" aria-label="Delivery location map" />
    <div className="location-actions">
      <button type="button" disabled={!ready || locating} onClick={locate}>{locating ? 'Locating…' : 'Use my current location'}</button>
      <button type="button" disabled={!ready} onClick={() => { revision.current++; change.current(point); setNotice('Delivery pin confirmed.'); }}>Confirm pin location</button>
    </div>
    <p className="location-notice" aria-live="polite">{notice}</p>
    {mapError && <p className="form-message">{mapError}</p>}
    <p className="location-coordinates" data-testid="delivery-coordinates">{value ? 'Selected' : 'Pin'}: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</p>
    <p className="location-help">Keep your house number, street and PIN code in the address fields too.</p>
  </section>;
}
