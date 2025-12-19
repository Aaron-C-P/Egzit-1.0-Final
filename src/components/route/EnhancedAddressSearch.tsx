import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, Clock, Navigation } from 'lucide-react';
import { 
  searchJamaicaLocations, 
  calculateDistance, 
  estimateTravelTime, 
  formatDistance, 
  formatTravelTime,
  type JamaicaLocation 
} from '@/lib/jamaica-locations';

interface EnhancedAddressSearchProps {
  label: string;
  placeholder: string;
  onSelect: (coords: [number, number], address: string) => void;
  value?: string;
  referenceCoords?: [number, number]; // For showing distance from another point
}

// Geoapify API key for Jamaica address suggestions
const GEOAPIFY_API_KEY = '49e9fbc8a11c471fb702b1d0b6b537d3';

interface GeoapifyResult {
  properties: {
    lat: number;
    lon: number;
    formatted: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    result_type: string;
  };
}

type SearchResult = {
  type: 'local' | 'geoapify';
  location?: JamaicaLocation;
  geoapify?: GeoapifyResult;
  displayName: string;
  coords: [number, number];
  distance?: number;
  travelTime?: number;
  resultType?: string;
};

export default function EnhancedAddressSearch({ 
  label, 
  placeholder, 
  onSelect, 
  value,
  referenceCoords 
}: EnhancedAddressSearchProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // First, search local Jamaica database
      const localResults = searchJamaicaLocations(searchQuery);
      
      // Convert to SearchResult format
      const localSearchResults: SearchResult[] = localResults.map(loc => {
        const distance = referenceCoords 
          ? calculateDistance(referenceCoords[0], referenceCoords[1], loc.lat, loc.lon)
          : undefined;
        const travelTime = distance ? estimateTravelTime(distance) : undefined;
        
        return {
          type: 'local' as const,
          location: loc,
          displayName: `${loc.name}, ${loc.parish}`,
          coords: [loc.lat, loc.lon] as [number, number],
          distance,
          travelTime,
        };
      });

      // Also search Geoapify for street-level accuracy in Jamaica
      const geoapifyUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&filter=countrycode:jm&limit=8&apiKey=${GEOAPIFY_API_KEY}`;
      
      const response = await fetch(geoapifyUrl);
      const geoapifyData = await response.json();
      
      // Add Geoapify results that aren't duplicates
      const geoapifyResults: SearchResult[] = (geoapifyData.features || [])
        .filter((geo: GeoapifyResult) => {
          const geoName = geo.properties.formatted.toLowerCase();
          return !localSearchResults.some(local => 
            geoName.includes(local.location!.name.toLowerCase()) ||
            local.location!.name.toLowerCase().includes(geo.properties.city?.toLowerCase() || '')
          );
        })
        .map((geo: GeoapifyResult) => {
          const lat = geo.properties.lat;
          const lon = geo.properties.lon;
          const distance = referenceCoords 
            ? calculateDistance(referenceCoords[0], referenceCoords[1], lat, lon)
            : undefined;
          const travelTime = distance ? estimateTravelTime(distance) : undefined;
          
          return {
            type: 'geoapify' as const,
            geoapify: geo,
            displayName: geo.properties.formatted,
            coords: [lat, lon] as [number, number],
            distance,
            travelTime,
            resultType: geo.properties.result_type,
          };
        });

      // Combine and prioritize: local results first, then Geoapify for street-level
      setResults([...localSearchResults, ...geoapifyResults].slice(0, 12));
      
      setShowResults(true);
    } catch (error) {
      console.error('Address search failed:', error);
      // Still show local results if API fails
      const localResults = searchJamaicaLocations(searchQuery);
      setResults(localResults.map(loc => ({
        type: 'local' as const,
        location: loc,
        displayName: `${loc.name}, ${loc.parish}`,
        coords: [loc.lat, loc.lon] as [number, number],
      })));
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [referenceCoords]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.displayName);
    setShowResults(false);
    onSelect(result.coords, result.displayName);
  };

  const handleSearchClick = () => {
    performSearch(query);
  };

  const getTypeIcon = (result: SearchResult) => {
    if (result.type === 'local' && result.location) {
      const type = result.location.type;
      if (type === 'city') return '🏙️';
      if (type === 'town') return '🏘️';
      if (type === 'landmark') return '📍';
      if (type === 'district') return '🏛️';
      return '📌';
    }
    // Geoapify result types
    if (result.resultType) {
      if (result.resultType === 'street') return '🛣️';
      if (result.resultType === 'building') return '🏠';
      if (result.resultType === 'amenity') return '🏪';
      if (result.resultType === 'locality') return '🏘️';
    }
    return '📍';
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="pl-10"
              onFocus={() => results.length > 0 && setShowResults(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />
          </div>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleSearchClick}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-elevated max-h-80 overflow-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{getTypeIcon(result)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.displayName}</p>
                    {result.location && (
                      <p className="text-xs text-muted-foreground">
                        {result.location.parish} Parish • {result.location.type}
                      </p>
                    )}
                    {result.type === 'geoapify' && result.resultType && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {result.resultType} • Street-level
                      </p>
                    )}
                    {(result.distance !== undefined || result.travelTime !== undefined) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {result.distance !== undefined && (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {formatDistance(result.distance)}
                          </span>
                        )}
                        {result.travelTime !== undefined && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTravelTime(result.travelTime)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-elevated p-4 text-center">
            <p className="text-sm text-muted-foreground">No locations found for "{query}"</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
