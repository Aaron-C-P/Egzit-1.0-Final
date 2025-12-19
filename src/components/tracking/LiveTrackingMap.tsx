import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, X, Truck, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LiveTrackingMapProps {
  currentLat?: number | null;
  currentLng?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  isInProgress?: boolean;
}

export function LiveTrackingMap({
  currentLat,
  currentLng,
  pickupAddress,
  deliveryAddress,
  isInProgress,
}: LiveTrackingMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const hasLocation = currentLat && currentLng;
  const defaultCenter: [number, number] = [18.1096, -77.2975];
  const center: [number, number] = hasLocation 
    ? [currentLat, currentLng] 
    : defaultCenter;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !hasLocation) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Create new map
    const map = L.map(containerRef.current, {
      center: center,
      zoom: 15,
      zoomControl: isFullscreen,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Create custom truck icon
    const truckIcon = L.divIcon({
      className: 'custom-truck-marker',
      html: `<div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    // Add marker
    const marker = L.marker(center, { icon: truckIcon })
      .addTo(map)
      .bindPopup(`<div style="text-align:center;padding:4px;"><b>Moving Truck</b><br/><small>${currentLat?.toFixed(4)}, ${currentLng?.toFixed(4)}</small></div>`);

    mapRef.current = map;
    markerRef.current = marker;

    // Handle resize
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasLocation, isFullscreen]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (mapRef.current && markerRef.current && hasLocation) {
      const newPos: [number, number] = [currentLat, currentLng];
      markerRef.current.setLatLng(newPos);
      mapRef.current.setView(newPos);
      markerRef.current.setPopupContent(
        `<div style="text-align:center;padding:4px;"><b>Moving Truck</b><br/><small>${currentLat?.toFixed(4)}, ${currentLng?.toFixed(4)}</small></div>`
      );
    }
  }, [currentLat, currentLng, hasLocation]);

  // Handle fullscreen resize
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!hasLocation && !isInProgress) {
    return (
      <div className="h-48 bg-muted relative flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Navigation className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Route preview</p>
          <p className="text-xs text-muted-foreground mt-1">
            Map will show when move starts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'relative h-64 rounded-lg overflow-hidden'}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-card/90 backdrop-blur shadow-md"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        {isFullscreen && (
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-card/90 backdrop-blur shadow-md"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-md ${
          hasLocation 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-destructive text-destructive-foreground'
        }`}>
          <div className={`w-2 h-2 rounded-full ${hasLocation ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {hasLocation ? 'Live Tracking' : 'Waiting for GPS'}
        </div>
      </div>

      {/* Map container or waiting state */}
      {hasLocation ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="h-full bg-muted flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
              <Truck className="h-8 w-8 text-destructive animate-pulse" />
            </div>
            <p className="font-medium text-destructive">Waiting for GPS signal...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Live tracking will appear once the driver's device sends location data
            </p>
          </div>
        </div>
      )}

      {/* Address info overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="bg-card/95 backdrop-blur rounded-lg p-3 shadow-md space-y-2">
          {pickupAddress && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 text-accent-foreground" />
              </div>
              <span className="text-sm truncate">{pickupAddress}</span>
            </div>
          )}
          {deliveryAddress && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 text-warning-foreground" />
              </div>
              <span className="text-sm truncate">{deliveryAddress}</span>
            </div>
          )}
          {hasLocation && (
            <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Lat: {currentLat?.toFixed(4)}</span>
              <span>Lng: {currentLng?.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
