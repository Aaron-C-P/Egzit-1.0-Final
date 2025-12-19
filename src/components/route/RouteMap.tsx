import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  pickupCoords?: [number, number];
  deliveryCoords?: [number, number];
  routeGeometry?: [number, number][];
  moverLocation?: [number, number];
  isTracking?: boolean;
}

const RouteMap = ({ 
  pickupCoords, 
  deliveryCoords, 
  routeGeometry,
  moverLocation,
  isTracking = false 
}: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const moverMarkerRef = useRef<L.Marker | null>(null);

  // Jamaica center coordinates
  const jamaicaCenter: [number, number] = [18.1096, -77.2975];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView(jamaicaCenter, 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;

    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker(pickupCoords, { icon: pickupIcon })
      .addTo(mapRef.current)
      .bindPopup('Pickup Location');
  }, [pickupCoords]);

  // Add delivery marker
  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;

    const deliveryIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker(deliveryCoords, { icon: deliveryIcon })
      .addTo(mapRef.current)
      .bindPopup('Delivery Location');
  }, [deliveryCoords]);

  // Draw route
  useEffect(() => {
    if (!mapRef.current || !routeGeometry || routeGeometry.length === 0) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
    }

    routeLayerRef.current = L.polyline(routeGeometry, {
      color: 'hsl(0, 84%, 50%)',
      weight: 4,
      opacity: 0.8,
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
  }, [routeGeometry]);

  // Track mover location
  useEffect(() => {
    if (!mapRef.current || !moverLocation || !isTracking) return;

    const moverIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-3 border-white animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (moverMarkerRef.current) {
      moverMarkerRef.current.setLatLng(moverLocation);
    } else {
      moverMarkerRef.current = L.marker(moverLocation, { icon: moverIcon })
        .addTo(mapRef.current)
        .bindPopup('Mover Location');
    }
  }, [moverLocation, isTracking]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[400px] rounded-xl overflow-hidden shadow-card"
    />
  );
};

export default RouteMap;
