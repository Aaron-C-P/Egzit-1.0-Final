import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Item = Tables<'items'>;

interface ItemCardProps {
  item: Item;
  onUpdate: () => void;
}

export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
      onClick={() => navigate(`/inventory/${item.id}`)}
    >
      <CardContent className="p-6">
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          {item.packed && (
            <Badge variant="secondary" className="ml-2">
              <Check className="h-3 w-3 mr-1" />
              Packed
            </Badge>
          )}
        </div>

        {item.category && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{item.category}</span>
          </div>
        )}

        {item.room && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.room}</span>
          </div>
        )}

        {item.fragile && (
          <Badge variant="destructive" className="mt-3">
            Fragile
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
