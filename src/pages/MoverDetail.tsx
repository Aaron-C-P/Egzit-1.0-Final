import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Star, Shield, Clock, MapPin, Phone, Mail, 
  Globe, Truck, CreditCard, Loader2, CheckCircle2, MessageSquare 
} from 'lucide-react';
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

export default function MoverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch mover details
  const { data: mover, isLoading } = useQuery({
    queryKey: ['mover', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch mover services
  const { data: services = [] } = useQuery({
    queryKey: ['mover-services', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mover_services')
        .select('service')
        .eq('mover_id', id);

      if (error) throw error;
      return data?.map(s => s.service) || [];
    },
    enabled: !!id,
  });

  // Fetch mover reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['mover-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mover_reviews')
        .select('*')
        .eq('mover_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const handleBookNow = () => {
    if (!mover) return;
    // Navigate to request-move page with mover pre-selected
    navigate(`/request-move?mover=${mover.id}`);
  };

  const handleChat = () => {
    if (mover) {
      navigate(`/chat/${mover.id}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!mover) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Mover Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This mover may no longer be available.
              </p>
              <Button onClick={() => navigate('/movers')}>
                Browse Movers
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Mover Details</h1>
          </div>
        </div>

        <div className="px-4 py-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left */}
            <div className="lg:col-span-2 space-y-4">
              {/* Profile Card */}
              <Card className="shadow-soft animate-fade-in overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
                <CardContent className="px-4 pb-4 -mt-16">
                  <div className="flex items-end gap-4 mb-4">
                    <img 
                      src={mover.logo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop'} 
                      alt={mover.name}
                      className="w-24 h-24 rounded-xl object-cover border-4 border-card shadow-lg"
                    />
                    <div className="flex-1 pb-1">
                      <h2 className="text-2xl font-bold">{mover.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">{mover.rating || 0}</span>
                        <span className="text-sm text-muted-foreground">({mover.review_count || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mover.available ? (
                      <StatusBadge status="success" label="Available Now" />
                    ) : (
                      <StatusBadge status="pending" label="Currently Busy" />
                    )}
                    {mover.verified && (
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {mover.insured && (
                      <Badge variant="outline">Insured</Badge>
                    )}
                  </div>

                  {mover.description && (
                    <p className="text-sm text-muted-foreground">{mover.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Services */}
              {services.length > 0 && (
                <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Services Offered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service, index) => (
                        <Badge key={index} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-warning" />
                      Recent Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted'}`} 
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Right */}
            <div className="space-y-4">
              {/* Pricing Card */}
              <Card className="shadow-card animate-fade-in sticky top-20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4 bg-muted/50 rounded-lg">
                    <span className="text-4xl font-bold text-primary">{getPriceTier(mover.price_range)}</span>
                    <p className="text-sm text-muted-foreground mt-1">Starting from {formatJMD(mover.min_price || 15000)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleBookNow} 
                      disabled={!mover.available} 
                      className="w-full"
                      size="lg"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Book Now
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      size="lg"
                      onClick={handleChat}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat with Mover
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '150ms' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mover.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{mover.location}</span>
                    </div>
                  )}
                  {mover.response_time && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Responds {mover.response_time}</span>
                    </div>
                  )}
                  {mover.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${mover.phone}`} className="text-primary hover:underline">{mover.phone}</a>
                    </div>
                  )}
                  {mover.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${mover.email}`} className="text-primary hover:underline">{mover.email}</a>
                    </div>
                  )}
                  {mover.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={mover.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
