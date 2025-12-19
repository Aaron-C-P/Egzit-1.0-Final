import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, Loader2, Sparkles } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AISuggestion {
  name: string;
  category: string;
  room: string;
  weight: number | null;
  fragile: boolean;
  notes: string;
}

export function AddItemDialog({ open, onOpenChange, onSuccess }: AddItemDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    room: '',
    weight: '',
    fragile: false,
    notes: '',
  });

  const analyzeImage = async (imageDataUrl: string) => {
    try {
      setIsAnalyzing(true);
      
      const { data, error } = await supabase.functions.invoke('categorize-item', {
        body: { imageData: imageDataUrl }
      });

      if (error) {
        console.error('AI analysis error:', error);
        // Don't show error toast - just silently fail
        return;
      }

      if (data && (data.name || data.category)) {
        setAiSuggestion({
          name: data.name || '',
          category: data.category || '',
          room: data.room || '',
          weight: data.weight,
          fragile: data.fragile || false,
          notes: data.notes || ''
        });
        // Auto-apply suggestions immediately
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          category: data.category || prev.category,
          room: data.room || prev.room,
          weight: data.weight ? String(data.weight) : prev.weight,
          fragile: data.fragile ?? prev.fragile,
          notes: data.notes || prev.notes,
        }));
        toast.success('AI filled in the details!', {
          description: 'Review and adjust if needed'
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        // Trigger AI analysis
        await analyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const acceptSuggestions = () => {
    if (aiSuggestion) {
      setFormData(prev => ({
        ...prev,
        name: aiSuggestion.name || prev.name,
        category: aiSuggestion.category || prev.category,
        room: aiSuggestion.room || prev.room,
        weight: aiSuggestion.weight ? String(aiSuggestion.weight) : prev.weight,
        fragile: aiSuggestion.fragile ?? prev.fragile,
        notes: aiSuggestion.notes || prev.notes,
      }));
      setAiSuggestion(null);
      toast.success('Suggestions applied!');
    }
  };

  const dismissSuggestions = () => {
    setAiSuggestion(null);
  };

  const uploadImage = async (itemId: string): Promise<string | null> => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${itemId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('item-photos')
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('item-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Get or create default inventory for user
      let { data: inventories, error: invError } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (invError) throw invError;

      let inventoryId: string;
      
      if (!inventories || inventories.length === 0) {
        const { data: newInv, error: createError } = await supabase
          .from('inventories')
          .insert({ user_id: user.id, name: 'My Inventory' })
          .select()
          .single();

        if (createError) throw createError;
        inventoryId = newInv.id;
      } else {
        inventoryId = inventories[0].id;
      }

      // Generate QR code data
      const qrCodeData = `EGZIT-ITEM-${Date.now()}`;

      // Insert item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          inventory_id: inventoryId,
          name: formData.name,
          category: formData.category || null,
          room: formData.room || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          fragile: formData.fragile,
          qr_code: qrCodeData,
          meta: { notes: formData.notes },
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await uploadImage(item.id);
        if (imageUrl) {
          await supabase
            .from('items')
            .update({ image_url: imageUrl })
            .eq('id', item.id);
        }
      }

      toast.success('Item added successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      room: '',
      weight: '',
      fragile: false,
      notes: '',
    });
    setImageFile(null);
    setImagePreview('');
    setAiSuggestion(null);
    setIsAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Photo</Label>
            <div className="flex gap-4">
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setAiSuggestion(null);
                    }}
                  >
                    Remove
                  </Button>
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        <span className="text-sm font-medium">AI analyzing...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
              )}
            </div>
          </div>

          {/* AI Analyzed Indicator */}
          {aiSuggestion && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary font-medium">AI auto-filled all fields - review and adjust if needed</p>
              </div>
            </div>
          )}

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Living Room Lamp"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Furniture"
                />
              </div>

              <div>
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Living Room"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="fragile"
                checked={formData.fragile}
                onCheckedChange={(checked) => setFormData({ ...formData, fragile: checked })}
              />
              <Label htmlFor="fragile" className="cursor-pointer">
                Mark as fragile
              </Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isAnalyzing}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
