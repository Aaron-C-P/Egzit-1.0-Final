import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Building2, Landmark, TreePine, Navigation } from 'lucide-react';
import { searchJamaicaLocations, JamaicaLocation } from '@/lib/jamaica-locations';
import { cn } from '@/lib/utils';

interface JamaicaLocationAutocompleteProps {
  value: string;
  onChange: (value: string, location?: JamaicaLocation) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const typeIcons = {
  city: Building2,
  town: Building2,
  village: TreePine,
  district: Navigation,
  landmark: Landmark,
};

export function JamaicaLocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  className,
  id,
}: JamaicaLocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<JamaicaLocation[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const results = searchJamaicaLocations(value);
    setSuggestions(results);
    setIsOpen(results.length > 0 && value.length > 1);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: JamaicaLocation) => {
    const fullAddress = `${location.name}, ${location.parish}`;
    onChange(fullAddress, location);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          onFocus={() => {
            if (suggestions.length > 0 && value.length > 1) {
              setIsOpen(true);
            }
          }}
        />
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((location, index) => {
            const Icon = typeIcons[location.type] || MapPin;
            return (
              <button
                key={`${location.name}-${location.parish}-${index}`}
                type="button"
                className="w-full px-3 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors border-b last:border-b-0"
                onClick={() => handleSelect(location)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  location.type === 'city' && "bg-primary/10",
                  location.type === 'town' && "bg-accent/10",
                  location.type === 'village' && "bg-muted",
                  location.type === 'district' && "bg-warning/10",
                  location.type === 'landmark' && "bg-destructive/10",
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    location.type === 'city' && "text-primary",
                    location.type === 'town' && "text-accent",
                    location.type === 'village' && "text-muted-foreground",
                    location.type === 'district' && "text-warning",
                    location.type === 'landmark' && "text-destructive",
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{location.parish} Parish</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize shrink-0">
                  {location.type}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
