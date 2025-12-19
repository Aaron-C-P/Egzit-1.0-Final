import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface AddressSearchProps {
  label: string;
  placeholder: string;
  onSelect: (coords: [number, number], address: string) => void;
  value?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const AddressSearch = ({ label, placeholder, onSelect, value }: AddressSearchProps) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Add Jamaica bias to search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Jamaica')}&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Address search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: NominatimResult) => {
    const coords: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setQuery(result.display_name);
    setShowResults(false);
    onSelect(coords, result.display_name);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            />
          </div>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={searchAddress}
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
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-elevated max-h-60 overflow-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;
