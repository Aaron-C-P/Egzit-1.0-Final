import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Play, Pause, Square, Navigation, Truck, 
  MapPin, Clock, Zap, RotateCcw 
} from 'lucide-react';

interface SimulationState {
  moveId: string;
  isRunning: boolean;
  progress: number; // 0-100
  currentLat: number;
  currentLng: number;
  speed: number; // km/h
}

export default function GPSSimulator() {
  const queryClient = useQueryClient();
  const [simulations, setSimulations] = useState<Map<string, SimulationState>>(new Map());
  const [speedMultiplier, setSpeedMultiplier] = useState(10); // 10x real time
  const intervalRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Fetch in-progress moves
  const { data: activeMoves = [] } = useQuery({
    queryKey: ['active-moves-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moves')
        .select('id, name, pickup_address, delivery_address, route_data, current_lat, current_lng, status')
        .eq('status', 'in_progress');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Update GPS position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async ({ moveId, lat, lng, eta }: { moveId: string; lat: number; lng: number; eta: Date }) => {
      const { error } = await supabase
        .from('moves')
        .update({
          current_lat: lat,
          current_lng: lng,
          estimated_arrival_time: eta.toISOString(),
        })
        .eq('id', moveId);

      if (error) throw error;

      // Add tracking event
      await supabase.from('move_tracking_events').insert({
        move_id: moveId,
        event_type: 'location_update',
        location_lat: lat,
        location_lng: lng,
        metadata: { speed_kmh: speedMultiplier * 5 },
      });
    },
    onError: (error) => {
      console.error('Failed to update position:', error);
    },
  });

  // Jamaica route coordinates (realistic path)
  const getRoutePoints = () => {
    // Kingston to Montego Bay route simulation
    return [
      { lat: 17.9714, lng: -76.7920 }, // Kingston start
      { lat: 17.9800, lng: -76.8200 },
      { lat: 18.0000, lng: -76.8500 },
      { lat: 18.0500, lng: -76.9000 },
      { lat: 18.1000, lng: -77.0000 },
      { lat: 18.1500, lng: -77.1500 },
      { lat: 18.2000, lng: -77.3000 },
      { lat: 18.2500, lng: -77.5000 },
      { lat: 18.3000, lng: -77.7000 },
      { lat: 18.4000, lng: -77.9000 },
      { lat: 18.4663, lng: -77.9186 }, // Montego Bay end
    ];
  };

  const startSimulation = (moveId: string) => {
    const move = activeMoves.find(m => m.id === moveId);
    if (!move) return;

    const routePoints = getRoutePoints();
    const startPoint = routePoints[0];

    setSimulations(prev => {
      const newMap = new Map(prev);
      newMap.set(moveId, {
        moveId,
        isRunning: true,
        progress: 0,
        currentLat: startPoint.lat,
        currentLng: startPoint.lng,
        speed: speedMultiplier * 5,
      });
      return newMap;
    });

    // Start simulation interval
    const interval = setInterval(() => {
      setSimulations(prev => {
        const sim = prev.get(moveId);
        if (!sim || !sim.isRunning) {
          clearInterval(interval);
          return prev;
        }

        const newProgress = Math.min(sim.progress + (speedMultiplier / 10), 100);
        const pointIndex = Math.floor((newProgress / 100) * (routePoints.length - 1));
        const nextPointIndex = Math.min(pointIndex + 1, routePoints.length - 1);
        
        const currentPoint = routePoints[pointIndex];
        const nextPoint = routePoints[nextPointIndex];
        const segmentProgress = ((newProgress / 100) * (routePoints.length - 1)) - pointIndex;
        
        const newLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress;
        const newLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress;

        // Calculate ETA
        const remainingPercent = 100 - newProgress;
        const etaMinutes = Math.round((remainingPercent / 100) * 120); // Assume 2 hour total journey
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + etaMinutes);

        // Update database
        updatePositionMutation.mutate({ moveId, lat: newLat, lng: newLng, eta });

        if (newProgress >= 100) {
          clearInterval(interval);
          toast.success(`Move simulation completed!`);
        }

        const newMap = new Map(prev);
        newMap.set(moveId, {
          ...sim,
          progress: newProgress,
          currentLat: newLat,
          currentLng: newLng,
        });
        return newMap;
      });
    }, 1000);

    intervalRef.current.set(moveId, interval);
    toast.success('GPS simulation started');
  };

  const pauseSimulation = (moveId: string) => {
    const interval = intervalRef.current.get(moveId);
    if (interval) {
      clearInterval(interval);
      intervalRef.current.delete(moveId);
    }

    setSimulations(prev => {
      const newMap = new Map(prev);
      const sim = newMap.get(moveId);
      if (sim) {
        newMap.set(moveId, { ...sim, isRunning: false });
      }
      return newMap;
    });

    toast.info('Simulation paused');
  };

  const stopSimulation = (moveId: string) => {
    const interval = intervalRef.current.get(moveId);
    if (interval) {
      clearInterval(interval);
      intervalRef.current.delete(moveId);
    }

    setSimulations(prev => {
      const newMap = new Map(prev);
      newMap.delete(moveId);
      return newMap;
    });

    toast.info('Simulation stopped');
  };

  const resetSimulation = (moveId: string) => {
    stopSimulation(moveId);
    const routePoints = getRoutePoints();
    
    updatePositionMutation.mutate({
      moveId,
      lat: routePoints[0].lat,
      lng: routePoints[0].lng,
      eta: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    toast.info('Position reset to start');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Speed Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simulation Speed
          </CardTitle>
          <CardDescription>Control how fast the GPS simulation runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20">1x</span>
            <Slider
              value={[speedMultiplier]}
              onValueChange={([value]) => setSpeedMultiplier(value)}
              min={1}
              max={50}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-20 text-right">{speedMultiplier}x</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current simulated speed: ~{speedMultiplier * 5} km/h
          </p>
        </CardContent>
      </Card>

      {/* Active Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Active Move Simulations
          </CardTitle>
          <CardDescription>Simulate GPS tracking for in-progress moves</CardDescription>
        </CardHeader>
        <CardContent>
          {activeMoves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No moves currently in progress</p>
              <p className="text-sm mt-2">
                Go to <strong>Move Requests</strong> tab → Find a scheduled move → Click <strong>"Start Move"</strong>
              </p>
              <p className="text-xs mt-3 text-muted-foreground/70">
                Only moves with "In Progress" status can be simulated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMoves.map(move => {
                const sim = simulations.get(move.id);
                const isRunning = sim?.isRunning || false;
                const progress = sim?.progress || 0;

                return (
                  <div key={move.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{move.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {move.pickup_address || 'Start'} → {move.delivery_address || 'End'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={isRunning ? 'default' : 'secondary'}>
                        {isRunning ? 'Simulating' : 'Idle'}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Journey Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Current Position */}
                    {sim && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Lat:</span>
                          <span className="font-mono">{sim.currentLat.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Lng:</span>
                          <span className="font-mono">{sim.currentLng.toFixed(4)}</span>
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-2">
                      {!isRunning ? (
                        <Button size="sm" onClick={() => startSimulation(move.id)}>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => pauseSimulation(move.id)}>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => stopSimulation(move.id)}>
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resetSimulation(move.id)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
