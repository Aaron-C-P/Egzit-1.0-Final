import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  ArrowLeft, ArrowRight, CalendarIcon, MapPin, Package, 
  Truck, CheckCircle2, Loader2, Home, Building2 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EnhancedAddressSearch from '@/components/route/EnhancedAddressSearch';
import { calculateDistance, estimateTravelTime, formatDistance, formatTravelTime } from '@/lib/jamaica-locations';
import MovePreviewMap from '@/components/route/MovePreviewMap';

type Step = 'pickup' | 'destination' | 'date' | 'details' | 'review';

const steps: { id: Step; title: string; icon: React.ElementType }[] = [
  { id: 'pickup', title: 'Pickup', icon: Home },
  { id: 'destination', title: 'Destination', icon: Building2 },
  { id: 'date', title: 'Date', icon: CalendarIcon },
  { id: 'details', title: 'Details', icon: Package },
  { id: 'review', title: 'Review', icon: CheckCircle2 },
];

export default function RequestMove() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedMoverId = searchParams.get('mover');
  
  // Fetch selected mover details
  const { data: selectedMover } = useQuery({
    queryKey: ['mover', selectedMoverId],
    queryFn: async () => {
      if (!selectedMoverId) return null;
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .eq('id', selectedMoverId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMoverId,
  });
  
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupCoords: null as [number, number] | null,
    destinationAddress: '',
    destinationCoords: null as [number, number] | null,
    moveDate: undefined as Date | undefined,
    inventorySize: 'medium',
    specialRequirements: '',
    name: '',
  });

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'pickup': return formData.pickupAddress.length > 5;
      case 'destination': return formData.destinationAddress.length > 5;
      case 'date': return !!formData.moveDate;
      case 'details': return formData.name.length > 2;
      case 'review': return true;
      default: return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { data: newMove, error } = await supabase.from('moves').insert({
        user_id: user.id,
        name: formData.name,
        pickup_address: formData.pickupAddress,
        delivery_address: formData.destinationAddress,
        move_date: formData.moveDate?.toISOString(),
        status: 'pending',
        assigned_mover_id: selectedMoverId || null,
      }).select().single();

      if (error) throw error;

      // Create initial tracking event
      if (newMove) {
        await supabase.from('move_tracking_events').insert({
          move_id: newMove.id,
          event_type: 'created',
          notes: 'Move request submitted',
        });
      }

      if (error) throw error;

      toast({
        title: 'Move request created!',
        description: 'We\'ll match you with available movers.',
      });
      navigate('/movers');
    } catch (error) {
      console.error('Error creating move:', error);
      toast({
        title: 'Error',
        description: 'Failed to create move request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inventorySizes = [
    { id: 'small', label: 'Studio/1BR', items: '~50 items' },
    { id: 'medium', label: '2-3 BR', items: '~150 items' },
    { id: 'large', label: '4+ BR', items: '300+ items' },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Request a Move</h1>
            </div>
            
            {/* Progress */}
            <Progress value={progress} className="h-1.5 mb-3" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <step.icon className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-4 py-6 max-w-lg mx-auto">
          {/* Step 1: Pickup */}
          {currentStep === 'pickup' && (
            <Card className="shadow-soft animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Where are you moving from?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <EnhancedAddressSearch
                    label="Pickup Address"
                    placeholder="Enter your current address..."
                    value={formData.pickupAddress}
                    onSelect={(coords, address) => setFormData(prev => ({ 
                      ...prev, 
                      pickupAddress: address,
                      pickupCoords: coords
                    }))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Search for your address or select a Jamaica location. Street-level addresses are supported.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Destination */}
          {currentStep === 'destination' && (
            <>
              <Card className="shadow-soft animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Where are you moving to?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <EnhancedAddressSearch
                      label="Destination Address"
                      placeholder="Enter your new address..."
                      value={formData.destinationAddress}
                      referenceCoords={formData.pickupCoords || undefined}
                      onSelect={(coords, address) => setFormData(prev => ({ 
                        ...prev, 
                        destinationAddress: address,
                        destinationCoords: coords
                      }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search for your new address. Distance and travel time are shown when pickup is set.
                  </p>
                </CardContent>
              </Card>
              
              {/* Map Preview with Distance/Time */}
              {formData.pickupCoords && formData.destinationCoords && (
                <Card className="shadow-soft mt-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Estimated Distance:</span>
                      <span className="font-medium">
                        {formatDistance(calculateDistance(
                          formData.pickupCoords[0], formData.pickupCoords[1],
                          formData.destinationCoords[0], formData.destinationCoords[1]
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Travel Time:</span>
                      <span className="font-medium">
                        ~{formatTravelTime(estimateTravelTime(calculateDistance(
                          formData.pickupCoords[0], formData.pickupCoords[1],
                          formData.destinationCoords[0], formData.destinationCoords[1]
                        ), 'truck'))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Step 3: Date */}
          {currentStep === 'date' && (
            <Card className="shadow-soft animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  When do you want to move?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !formData.moveDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.moveDate ? format(formData.moveDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.moveDate}
                      onSelect={(date) => updateField('moveDate', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground mt-4">
                  Choose your preferred moving date. Flexible dates often get better pricing.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Details */}
          {currentStep === 'details' && (
            <Card className="shadow-soft animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Tell us about your move
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Move Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Apartment to new house"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Inventory Size</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {inventorySizes.map((size) => (
                      <Button
                        key={size.id}
                        variant={formData.inventorySize === size.id ? 'default' : 'outline'}
                        className="h-auto py-3 flex-col"
                        onClick={() => updateField('inventorySize', size.id)}
                      >
                        <span className="font-semibold">{size.label}</span>
                        <span className="text-xs opacity-70">{size.items}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="special">Special Requirements (optional)</Label>
                  <Textarea
                    id="special"
                    placeholder="e.g., Piano, fragile antiques, stairs..."
                    value={formData.specialRequirements}
                    onChange={(e) => updateField('specialRequirements', e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <Card className="shadow-soft animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  Review Your Move Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Move Name</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium text-right max-w-[60%]">{formData.pickupAddress}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium text-right max-w-[60%]">{formData.destinationAddress}</span>
                  </div>
                  {formData.pickupCoords && formData.destinationCoords && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-medium">
                        {formatDistance(calculateDistance(
                          formData.pickupCoords[0], formData.pickupCoords[1],
                          formData.destinationCoords[0], formData.destinationCoords[1]
                        ))}
                      </span>
                    </div>
                  )}
                  {formData.pickupCoords && formData.destinationCoords && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Est. Travel Time</span>
                      <span className="font-medium">
                        ~{formatTravelTime(estimateTravelTime(calculateDistance(
                          formData.pickupCoords[0], formData.pickupCoords[1],
                          formData.destinationCoords[0], formData.destinationCoords[1]
                        ), 'truck'))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {formData.moveDate ? format(formData.moveDate, 'PPP') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium capitalize">{formData.inventorySize}</span>
                  </div>
                  {selectedMover && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Selected Mover</span>
                      <span className="font-medium text-primary">{selectedMover.name}</span>
                    </div>
                  )}
                  {formData.specialRequirements && (
                    <div className="py-2">
                      <span className="text-muted-foreground block mb-1">Special Requirements</span>
                      <span className="text-sm">{formData.specialRequirements}</span>
                    </div>
                  )}
                </div>

                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <div className="flex items-center gap-2 text-accent mb-1">
                    <Truck className="h-4 w-4" />
                    <span className="font-semibold text-sm">What happens next?</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll match you with available movers and send you quotes within 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            
            {currentStep !== 'review' ? (
              <Button 
                onClick={nextStep} 
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
