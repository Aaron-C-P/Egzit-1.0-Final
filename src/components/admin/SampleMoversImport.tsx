import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Download, Truck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const sampleMovers = [
  {
    name: 'Island Express Movers',
    description: 'Jamaica\'s premier moving service with over 15 years of experience. We handle residential and commercial moves across the island with care and professionalism.',
    location: 'Kingston',
    phone: '+1 (876) 555-0101',
    email: 'info@islandexpress.jm',
    website: 'https://islandexpressmovers.jm',
    min_price: 15000,
    price_range: '$$',
    response_time: '< 2 hours',
    available: true,
    verified: true,
    insured: true,
    rating: 4.8,
    review_count: 156,
    logo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    services: ['Residential Moving', 'Commercial Moving', 'Packing Services', 'Storage', 'Furniture Assembly'],
  },
  {
    name: 'MoBay Swift Relocations',
    description: 'Serving the North Coast with reliable and affordable moving solutions. From Montego Bay to Ocho Rios, we\'ve got you covered.',
    location: 'Montego Bay',
    phone: '+1 (876) 555-0202',
    email: 'contact@mobayswift.jm',
    website: 'https://mobayswift.jm',
    min_price: 12000,
    price_range: '$',
    response_time: '< 1 hour',
    available: true,
    verified: true,
    insured: true,
    rating: 4.6,
    review_count: 89,
    logo_url: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=100&h=100&fit=crop',
    services: ['Residential Moving', 'Long Distance', 'Packing Services'],
  },
  {
    name: 'Spanish Town Haulers',
    description: 'Family-owned moving company specializing in St. Catherine and surrounding parishes. Affordable rates with no hidden fees.',
    location: 'Spanish Town',
    phone: '+1 (876) 555-0303',
    email: 'info@sthaulers.jm',
    website: '',
    min_price: 8000,
    price_range: '$',
    response_time: 'Same day',
    available: true,
    verified: false,
    insured: true,
    rating: 4.3,
    review_count: 42,
    logo_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&h=100&fit=crop',
    services: ['Residential Moving', 'Same Day Service', 'Small Moves'],
  },
  {
    name: 'Manchester Moving Co.',
    description: 'Mandeville\'s trusted moving partner. We specialize in careful handling of antiques and valuables with white-glove service.',
    location: 'Mandeville',
    phone: '+1 (876) 555-0404',
    email: 'moves@manchesterco.jm',
    website: 'https://manchestermovingco.jm',
    min_price: 18000,
    price_range: '$$$',
    response_time: '< 4 hours',
    available: true,
    verified: true,
    insured: true,
    rating: 4.9,
    review_count: 67,
    logo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop',
    services: ['White Glove Service', 'Antique Moving', 'Art Handling', 'Climate Controlled Storage'],
  },
  {
    name: 'Portmore Express',
    description: 'Quick and efficient moving services for the Greater Portmore area. Perfect for apartment and condo moves.',
    location: 'Portmore',
    phone: '+1 (876) 555-0505',
    email: 'book@portmoreexpress.jm',
    website: '',
    min_price: 10000,
    price_range: '$',
    response_time: '< 2 hours',
    available: true,
    verified: false,
    insured: false,
    rating: 4.1,
    review_count: 28,
    logo_url: 'https://images.unsplash.com/photo-1519003300449-424ad0405076?w=100&h=100&fit=crop',
    services: ['Apartment Moving', 'Same Day Service', 'Loading Help'],
  },
  {
    name: 'Ocho Rios Premium Movers',
    description: 'Luxury moving services for the resort town. We understand the importance of discretion and timely service.',
    location: 'Ocho Rios',
    phone: '+1 (876) 555-0606',
    email: 'vip@orpmovers.jm',
    website: 'https://ochoriospremiummmovers.jm',
    min_price: 25000,
    price_range: '$$$',
    response_time: 'By appointment',
    available: true,
    verified: true,
    insured: true,
    rating: 5.0,
    review_count: 34,
    logo_url: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=100&h=100&fit=crop',
    services: ['Luxury Moves', 'Villa Relocations', 'International Shipping', 'Concierge Service'],
  },
];

export default function SampleMoversImport() {
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      let successCount = 0;
      let skipCount = 0;

      for (const mover of sampleMovers) {
        // Check if mover already exists
        const { data: existing } = await supabase
          .from('movers')
          .select('id')
          .eq('name', mover.name)
          .maybeSingle();

        if (existing) {
          skipCount++;
          continue;
        }

        // Insert mover
        const { data: newMover, error: moverError } = await supabase
          .from('movers')
          .insert({
            name: mover.name,
            description: mover.description,
            location: mover.location,
            phone: mover.phone,
            email: mover.email,
            website: mover.website || null,
            min_price: mover.min_price,
            price_range: mover.price_range,
            response_time: mover.response_time,
            available: mover.available,
            verified: mover.verified,
            insured: mover.insured,
            rating: mover.rating,
            review_count: mover.review_count,
            logo_url: mover.logo_url,
          })
          .select()
          .single();

        if (moverError) {
          console.error('Error inserting mover:', moverError);
          continue;
        }

        // Insert services
        if (newMover && mover.services.length > 0) {
          const { error: servicesError } = await supabase
            .from('mover_services')
            .insert(
              mover.services.map(service => ({
                mover_id: newMover.id,
                service,
              }))
            );

          if (servicesError) {
            console.error('Error inserting services:', servicesError);
          }
        }

        successCount++;
      }

      // Refresh movers list
      queryClient.invalidateQueries({ queryKey: ['admin-movers'] });
      queryClient.invalidateQueries({ queryKey: ['movers'] });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} movers`, {
          description: skipCount > 0 ? `Skipped ${skipCount} existing movers` : undefined,
        });
      } else if (skipCount > 0) {
        toast.info('All sample movers already exist');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import sample movers');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleImport} 
      disabled={isImporting}
      className="gap-2"
    >
      {isImporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Import Sample Movers
    </Button>
  );
}
