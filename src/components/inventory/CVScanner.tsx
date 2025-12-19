import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, Sparkles, Plus, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CVScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemDetected: (item: { name: string; category: string; imageData: string }) => void;
}

interface DetectedItem {
  name: string;
  category: string;
  room?: string;
  weight?: number;
  fragile?: boolean;
  confidence: number;
}

export default function CVScanner({ open, onOpenChange, onItemDetected }: CVScannerProps) {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'environment',
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      await analyzeImage(imageSrc);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        await analyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    try {
      setIsAnalyzing(true);
      setDetectedItems([]);

      const { data, error } = await supabase.functions.invoke('categorize-item', {
        body: { imageData, multiItem: true }
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast.error('Failed to analyze image');
        return;
      }

      if (data) {
        // Support both single and multiple item detection
        const items = Array.isArray(data.items) 
          ? data.items 
          : [{ 
              name: data.name, 
              category: data.category, 
              room: data.room,
              weight: data.weight,
              fragile: data.fragile,
              confidence: 0.9 
            }];
        
        setDetectedItems(items.filter((item: any) => item.name));
        
        if (items.length > 0) {
          toast.success(`Detected ${items.length} item(s)!`);
        } else {
          toast.info('No items detected. Try a clearer photo.');
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addItemToInventory = async (item: DetectedItem) => {
    if (!user || !capturedImage) {
      toast.error('Unable to add item');
      return;
    }

    try {
      setIsAdding(true);

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
      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert({
          inventory_id: inventoryId,
          name: item.name,
          category: item.category || null,
          room: item.room || null,
          weight: item.weight || null,
          fragile: item.fragile || false,
          qr_code: qrCodeData,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Upload image
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const fileName = `${user.id}/${newItem.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, blob, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName);

        await supabase
          .from('items')
          .update({ image_url: urlData.publicUrl })
          .eq('id', newItem.id);
      }

      toast.success(`${item.name} added to inventory!`);
      
      // Remove this item from detected items list
      setDetectedItems(prev => prev.filter(i => i.name !== item.name));
      
      // Notify parent
      onItemDetected({ name: item.name, category: item.category, imageData: capturedImage });

      // If no more items, close dialog
      if (detectedItems.length <= 1) {
        onOpenChange(false);
        resetState();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setIsAdding(false);
    }
  };

  const resetState = () => {
    setCapturedImage(null);
    setDetectedItems([]);
    setIsAnalyzing(false);
    setIsAdding(false);
  };

  const retake = () => {
    setCapturedImage(null);
    setDetectedItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Item Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'camera' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('camera')}
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
            <Button
              variant={mode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* Camera/Image View */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : mode === 'camera' ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <Upload className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm text-white/70 mb-4">Upload a photo to analyze</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Scanning Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-white font-medium">Analyzing with AI...</p>
                <p className="text-white/70 text-sm">Detecting items in image</p>
              </div>
            )}

            {/* Scan Frame Overlay */}
            {!capturedImage && mode === 'camera' && !isAnalyzing && (
              <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
            )}
          </div>

          {/* Capture/Retake Button */}
          {!capturedImage && mode === 'camera' && (
            <Button className="w-full" onClick={capture}>
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          )}

          {capturedImage && !isAnalyzing && detectedItems.length === 0 && (
            <Button className="w-full" variant="outline" onClick={retake}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Photo
            </Button>
          )}

          {/* Detected Items */}
          {detectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Detected Items - Click "Add" to save:</p>
              <div className="grid gap-2">
                {detectedItems.map((item, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.category}
                          {item.room && ` • ${item.room}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {Math.round((item.confidence || 0.9) * 100)}%
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => addItemToInventory(item)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={retake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Scan Another Item
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}