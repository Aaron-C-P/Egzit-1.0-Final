import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/navigation/AppLayout';
import RouteMap from '@/components/route/RouteMap';
import EnhancedAddressSearch from '@/components/route/EnhancedAddressSearch';
import RouteDetails from '@/components/route/RouteDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, RefreshCw, Truck, Car, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDistance, estimateTravelTime, formatDistance, formatTravelTime } from '@/lib/jamaica-locations';

interface RouteResult {
  primary: {
    distance: number;
    duration: number;
    geometry: [number, number][];
  };
  alternatives: {
    distance: number;
    duration: number;
    geometry: [number, number][];
  }[];
}

const Route = () => {
  const [searchParams] = useSearchParams();
  const moveId = searchParams.get('moveId');
  
  const [pickupCoords, setPickupCoords] = useState<[number, number] | undefined>();
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | undefined>();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'truck'>('truck');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Fetch move data if moveId is provided
  const { data: moveData } = useQuery({
    queryKey: ['move-route', moveId],
    queryFn: async () => {
      if (!moveId) return null;
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('id', moveId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!moveId,
  });

  // Fetch route when both coordinates are set
  const { 
    data: routeData, 
    isLoading: isCalculating,
    refetch: recalculateRoute 
  } = useQuery({
    queryKey: ['route', pickupCoords, deliveryCoords, vehicleType],
    queryFn: async (): Promise<RouteResult> => {
      const { data, error } = await supabase.functions.invoke('route-optimizer', {
        body: {
          pickup: pickupCoords,
          delivery: deliveryCoords,
          vehicleType,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    enabled: !!pickupCoords && !!deliveryCoords,
  });

  const handlePickupSelect = (coords: [number, number], address: string) => {
    setPickupCoords(coords);
    setPickupAddress(address);
  };

  const handleDeliverySelect = (coords: [number, number], address: string) => {
    setDeliveryCoords(coords);
    setDeliveryAddress(address);
  };

  const getCurrentRoute = () => {
    if (!routeData) return null;
    if (selectedRouteIndex === 0) return routeData.primary;
    return routeData.alternatives[selectedRouteIndex - 1];
  };

  const currentRoute = getCurrentRoute();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-6 pb-8">
          <h1 className="text-2xl font-bold">Route Optimization</h1>
          <p className="text-primary-foreground/80 mt-1">
            Plan your move with optimized routes
          </p>
        </div>

        <div className="px-4 -mt-4 space-y-4">
          {/* Address Inputs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Route Planning</span>
                <div className="flex gap-2">
                  <Button
                    variant={vehicleType === 'car' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVehicleType('car')}
                  >
                    <Car className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={vehicleType === 'truck' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVehicleType('truck')}
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedAddressSearch
                label="Pickup Address"
                placeholder="Search Jamaica locations..."
                value={moveData?.pickup_address || pickupAddress}
                onSelect={handlePickupSelect}
              />
              <EnhancedAddressSearch
                label="Delivery Address"
                placeholder="Search Jamaica locations..."
                value={moveData?.delivery_address || deliveryAddress}
                onSelect={handleDeliverySelect}
                referenceCoords={pickupCoords}
              />

              {/* Distance Summary */}
              {pickupCoords && deliveryCoords && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {formatDistance(calculateDistance(
                          pickupCoords[0], pickupCoords[1],
                          deliveryCoords[0], deliveryCoords[1]
                        ))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        ~{formatTravelTime(estimateTravelTime(
                          calculateDistance(
                            pickupCoords[0], pickupCoords[1],
                            deliveryCoords[0], deliveryCoords[1]
                          ),
                          vehicleType
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {pickupCoords && deliveryCoords && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => recalculateRoute()}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Recalculate Route
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <RouteMap
            pickupCoords={pickupCoords}
            deliveryCoords={deliveryCoords}
            routeGeometry={currentRoute?.geometry}
          />

          {/* Route Details */}
          {isCalculating ? (
            <Card>
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Calculating optimal route...</span>
              </CardContent>
            </Card>
          ) : (
            <RouteDetails
              distance={currentRoute?.distance}
              duration={currentRoute?.duration}
              alternativeRoutes={routeData?.alternatives}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
            />
          )}

          {/* Navigation Button */}
          {currentRoute && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (pickupCoords && deliveryCoords) {
                  // Open in external maps app
                  const url = `https://www.openstreetmap.org/directions?from=${pickupCoords[0]},${pickupCoords[1]}&to=${deliveryCoords[0]},${deliveryCoords[1]}`;
                  window.open(url, '_blank');
                }
              }}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Open in Maps
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Route;
