import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JamaicaLocation, calculateDistance, estimateTravelTime, formatDistance, formatTravelTime } from '@/lib/jamaica-locations';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Route } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MovePreviewMapProps {
  pickupLocation?: JamaicaLocation | null;
  destinationLocation?: JamaicaLocation | null;
}

const MovePreviewMap = ({ pickupLocation, destinationLocation }: MovePreviewMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const lineRef = useRef<L.Polyline | null>(null);

  // Jamaica center coordinates
  const jamaicaCenter: [number, number] = [18.1096, -77.2975];

  // Calculate distance and time if both locations exist
  const distance = pickupLocation && destinationLocation
    ? calculateDistance(pickupLocation.lat, pickupLocation.lon, destinationLocation.lat, destinationLocation.lon)
    : null;
  const travelTime = distance ? estimateTravelTime(distance, 'truck') : null;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(jamaicaCenter, 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // Add pickup marker
    if (pickupLocation) {
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

      const marker = L.marker([pickupLocation.lat, pickupLocation.lon], { icon: pickupIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>Pickup:</strong> ${pickupLocation.name}`);
      markersRef.current.push(marker);
      bounds.extend([pickupLocation.lat, pickupLocation.lon]);
    }

    // Add destination marker
    if (destinationLocation) {
      const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([destinationLocation.lat, destinationLocation.lon], { icon: destIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>Destination:</strong> ${destinationLocation.name}`);
      markersRef.current.push(marker);
      bounds.extend([destinationLocation.lat, destinationLocation.lon]);
    }

    // Draw line between points
    if (pickupLocation && destinationLocation) {
      lineRef.current = L.polyline(
        [
          [pickupLocation.lat, pickupLocation.lon],
          [destinationLocation.lat, destinationLocation.lon]
        ],
        { color: 'hsl(0, 84%, 50%)', weight: 3, opacity: 0.7, dashArray: '10, 10' }
      ).addTo(mapRef.current);
    }

    // Fit bounds if we have markers
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [pickupLocation, destinationLocation]);

  if (!pickupLocation && !destinationLocation) {
    return null;
  }

  return (
    <Card className="shadow-soft mt-4 overflow-hidden">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[200px]"
      />
      {distance !== null && travelTime !== null && (
        <CardContent className="p-3 bg-muted/50">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-medium">{formatDistance(distance)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="font-medium">~{formatTravelTime(travelTime)}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MovePreviewMap;
