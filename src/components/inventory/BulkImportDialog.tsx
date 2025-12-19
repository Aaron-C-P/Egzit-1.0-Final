import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2, X, Sparkles, ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PendingItem {
  file: File;
  preview: string;
  name: string;
  category: string;
  isProcessing: boolean;
  isComplete: boolean;
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingItem[] = [];

    for (const file of files) {
      const preview = await readFileAsDataURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      
      newItems.push({
        file,
        preview,
        name: capitalizeWords(name),
        category: '',
        isProcessing: false,
        isComplete: false,
      });
    }

    setPendingItems(prev => [...prev, ...newItems]);
    
    // Auto-categorize with AI
    for (let i = pendingItems.length; i < pendingItems.length + newItems.length; i++) {
      categorizeItem(i, newItems[i - pendingItems.length].preview);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  };

  const categorizeItem = async (index: number, imageData: string) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, isProcessing: true } : item
    ));

    try {
      const { data, error } = await supabase.functions.invoke('categorize-item', {
        body: { imageData }
      });

      if (error) throw error;

      setPendingItems(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          category: data.category || '',
          name: data.name || item.name,
          isProcessing: false 
        } : item
      ));
    } catch (error) {
      console.error('AI categorization error:', error);
      setPendingItems(prev => prev.map((item, i) => 
        i === index ? { ...item, isProcessing: false } : item
      ));
    }
  };

  const removeItem = (index: number) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemName = (index: number, name: string) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, name } : item
    ));
  };

  const updateItemCategory = (index: number, category: string) => {
    setPendingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, category } : item
    ));
  };

  const handleImport = async () => {
    if (!user || pendingItems.length === 0) return;

    try {
      setIsUploading(true);
      setProgress(0);

      // Get or create default inventory
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

      const total = pendingItems.length;
      let completed = 0;

      for (const item of pendingItems) {
        // Create item
        const qrCodeData = `EGZIT-ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            inventory_id: inventoryId,
            name: item.name,
            category: item.category || null,
            qr_code: qrCodeData,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Upload image
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${user.id}/${newItem.id}.${fileExt}`;

        await supabase.storage
          .from('item-photos')
          .upload(fileName, item.file, { upsert: true });

        const { data: urlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName);

        await supabase
          .from('items')
          .update({ image_url: urlData.publicUrl })
          .eq('id', newItem.id);

        completed++;
        setProgress((completed / total) * 100);
      }

      toast.success(`Successfully imported ${total} items`);
      setPendingItems([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Failed to import items');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setPendingItems([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Items
          </DialogTitle>
          <DialogDescription>
            Upload multiple photos to quickly add items. AI will automatically suggest names and categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Click to select photos or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WebP
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
              disabled={isUploading}
            />
          </div>

          {/* Pending Items Grid */}
          {pendingItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">
                {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} ready to import
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pendingItems.map((item, index) => (
                  <div key={index} className="relative bg-card border rounded-lg overflow-hidden">
                    <img 
                      src={item.preview} 
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeItem(index)}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <div className="p-3 space-y-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemName(index, e.target.value)}
                        className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                        disabled={isUploading}
                      />
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {item.isProcessing ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : item.category ? (
                          <>
                            <Sparkles className="h-3 w-3 text-primary" />
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => updateItemCategory(index, e.target.value)}
                              className="flex-1 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                              disabled={isUploading}
                            />
                          </>
                        ) : (
                          <span>No category</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Importing items... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={pendingItems.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${pendingItems.length} Item${pendingItems.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}