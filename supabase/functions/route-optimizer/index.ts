import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RouteRequest {
  pickup: [number, number]; // [lat, lon]
  delivery: [number, number]; // [lat, lon]
  vehicleType?: 'car' | 'truck';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pickup, delivery, vehicleType = 'car' } = await req.json() as RouteRequest;

    if (!pickup || !delivery) {
      return new Response(
        JSON.stringify({ error: "Pickup and delivery coordinates are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OpenRouteService uses [lon, lat] format
    const start = `${pickup[1]},${pickup[0]}`;
    const end = `${delivery[1]},${delivery[0]}`;

    // Get the API key from secrets (optional - ORS has a demo endpoint)
    const apiKey = Deno.env.get("OPENROUTESERVICE_API_KEY");
    
    let routeData;
    
    if (apiKey) {
      // Use authenticated API with alternatives
      const profile = vehicleType === 'truck' ? 'driving-hgv' : 'driving-car';
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}&alternative_routes=true`,
        {
          headers: { 'Accept': 'application/json, application/geo+json' }
        }
      );
      
      if (!response.ok) {
        throw new Error(`OpenRouteService API error: ${response.statusText}`);
      }
      
      routeData = await response.json();
    } else {
      // Use demo endpoint (limited, no alternatives)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?overview=full&geometries=geojson&alternatives=true`
      );
      
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.statusText}`);
      }
      
      const osrmData = await response.json();
      
      // Transform OSRM response to our format
      routeData = {
        routes: osrmData.routes.map((route: any) => ({
          summary: {
            distance: route.distance,
            duration: route.duration,
          },
          geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
        })),
      };
    }

    // Process routes
    const routes = routeData.routes || routeData.features?.map((f: any) => ({
      summary: f.properties.summary,
      geometry: f.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
    })) || [];

    if (routes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No route found between the specified locations" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      primary: {
        distance: routes[0].summary?.distance || routes[0].distance,
        duration: routes[0].summary?.duration || routes[0].duration,
        geometry: routes[0].geometry,
      },
      alternatives: routes.slice(1).map((route: any) => ({
        distance: route.summary?.distance || route.distance,
        duration: route.summary?.duration || route.duration,
        geometry: route.geometry,
      })),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Route optimization error:", error);
    const message = error instanceof Error ? error.message : "Failed to calculate route";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
