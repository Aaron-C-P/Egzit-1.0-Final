import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Navigation, Truck, Route as RouteIcon } from 'lucide-react';

interface RouteDetailsProps {
  distance?: number; // in meters
  duration?: number; // in seconds
  alternativeRoutes?: {
    distance: number;
    duration: number;
  }[];
  selectedRouteIndex?: number;
  onSelectRoute?: (index: number) => void;
}

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const RouteDetails = ({ 
  distance, 
  duration, 
  alternativeRoutes = [],
  selectedRouteIndex = 0,
  onSelectRoute 
}: RouteDetailsProps) => {
  if (!distance || !duration) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RouteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Enter pickup and delivery addresses to calculate route
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Primary Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="text-lg font-semibold">{formatDistance(distance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Time</p>
                <p className="text-lg font-semibold">{formatDuration(duration)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {alternativeRoutes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alternative Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alternativeRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => onSelectRoute?.(index + 1)}
                className={`w-full p-3 rounded-lg border transition-colors text-left ${
                  selectedRouteIndex === index + 1
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Route {index + 2}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDistance(route.distance)}</span>
                    <span>{formatDuration(route.duration)}</span>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteDetails;
