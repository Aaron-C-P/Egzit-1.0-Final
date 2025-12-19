import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Shield, Clock, Truck, ChevronRight, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatJMD } from '@/lib/utils';

// Convert price_range symbols to display-friendly labels
const getPriceTier = (range: string | null): string => {
  switch (range) {
    case '$': return 'Budget';
    case '$$': return 'Standard';
    case '$$$': return 'Premium';
    case '$$$$': return 'Elite';
    default: return range || 'Standard';
  }
};

interface Mover {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  rating: number | null;
  review_count: number | null;
  price_range: string | null;
  min_price: number | null;
  location: string | null;
  response_time: string | null;
  verified: boolean | null;
  insured: boolean | null;
  available: boolean | null;
  services?: string[];
}

export default function Movers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters = ['All', 'Available Now', 'Verified', 'Top Rated', 'Budget'];

  const { data: movers = [], isLoading } = useQuery({
    queryKey: ['movers'],
    queryFn: async () => {
      const { data: moversData, error: moversError } = await supabase
        .from('movers')
        .select('*')
        .order('rating', { ascending: false });

      if (moversError) throw moversError;

      const { data: servicesData, error: servicesError } = await supabase
        .from('mover_services')
        .select('mover_id, service');

      if (servicesError) throw servicesError;

      const moversWithServices: Mover[] = (moversData || []).map(mover => ({
        ...mover,
        services: servicesData?.filter(s => s.mover_id === mover.id).map(s => s.service) || []
      }));

      return moversWithServices;
    },
  });

  const filteredMovers = movers.filter(mover => {
    const matchesSearch = mover.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mover.services?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!selectedFilter || selectedFilter === 'All') return matchesSearch;
    if (selectedFilter === 'Available Now') return matchesSearch && mover.available;
    if (selectedFilter === 'Verified') return matchesSearch && mover.verified;
    if (selectedFilter === 'Top Rated') return matchesSearch && (mover.rating || 0) >= 4.8;
    if (selectedFilter === 'Budget') return matchesSearch && mover.price_range === '$';
    return matchesSearch;
  });

  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Find Movers</h1>
            <p className="text-primary-foreground/80">Compare and book trusted moving services</p>
          </div>
        </div>

        <div className="px-4 -mt-4 max-w-6xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movers or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl shadow-card bg-card"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter || (!selectedFilter && filter === 'All') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className="rounded-full whitespace-nowrap shrink-0"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="px-4 mt-4 max-w-6xl mx-auto pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{filteredMovers.length} movers available</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredMovers.map((mover, index) => (
                  <Card 
                    key={mover.id}
                    className="shadow-soft card-interactive cursor-pointer animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/movers/${mover.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative shrink-0">
                          <img 
                            src={mover.logo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop'} 
                            alt={mover.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          {mover.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                              <Shield className="h-3 w-3 text-accent-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-base truncate">{mover.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                                <span className="text-sm font-medium">{mover.rating || 0}</span>
                                <span className="text-xs text-muted-foreground">({mover.review_count || 0})</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-bold text-primary">{getPriceTier(mover.price_range)}</span>
                              <p className="text-xs text-muted-foreground">from {formatJMD(mover.min_price || 0)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mover.available ? (
                              <StatusBadge status="success" label="Available" />
                            ) : (
                              <StatusBadge status="pending" label="Busy" />
                            )}
                            {mover.insured && <Badge variant="outline" className="text-xs">Insured</Badge>}
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {mover.location || 'Local'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {mover.response_time || '< 2 hours'}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground self-center shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMovers.length === 0 && !isLoading && (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-semibold mb-1">No movers found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="px-4 pb-6 max-w-6xl mx-auto">
          <Card className="shadow-soft bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Book a Move</h4>
                  <p className="text-xs text-muted-foreground">Enter your move details and get a quote</p>
                </div>
                <Button size="sm" onClick={() => navigate('/request-move')}>Book Movers</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
