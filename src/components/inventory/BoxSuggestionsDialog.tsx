import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Box, Sparkles, Loader2, AlertTriangle, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Item {
  id: string;
  name: string;
  category: string | null;
  room: string | null;
  weight: number | null;
  fragile: boolean | null;
  inventory_id: string | null;
}

interface BoxSuggestion {
  boxName: string;
  boxSize: string;
  dimensions: string;
  maxWeight: number;
  items: Item[];
  totalWeight: number;
  isFragile: boolean;
  room: string;
  reasoning: string;
}

interface BoxSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  onSuccess: () => void;
}

export function BoxSuggestionsDialog({ open, onOpenChange, items, onSuccess }: BoxSuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<BoxSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdBoxes, setCreatedBoxes] = useState<{ id: string; name: string; qrCode: string; isFragile: boolean }[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const unboxedItems = items.filter(item => !item.hasOwnProperty('box_id') || !(item as any).box_id);

  const generateSuggestions = async () => {
    if (unboxedItems.length === 0) {
      toast({
        title: "No items to box",
        description: "All items are already assigned to boxes or there are no items.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setCreatedBoxes([]);

    try {
      const { data, error } = await supabase.functions.invoke('suggest-boxes', {
        body: { items: unboxedItems }
      });

      if (error) throw error;

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        // Auto-select all suggestions
        setSelectedSuggestions(new Set(data.suggestions.map((_: any, i: number) => i)));
        toast({
          title: "Suggestions ready",
          description: `AI suggested ${data.suggestions.length} box groupings for your items.`,
        });
      } else {
        toast({
          title: "No suggestions",
          description: "Could not generate box suggestions for these items.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate box suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const createSelectedBoxes = async () => {
    if (!user || selectedSuggestions.size === 0) return;

    setIsCreating(true);
    const created: { id: string; name: string; qrCode: string; isFragile: boolean }[] = [];

    try {
      // Get user's inventory
      const { data: inventories } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const inventoryId = inventories?.[0]?.id;

      for (const index of Array.from(selectedSuggestions)) {
        const suggestion = suggestions[index];
        if (!suggestion) continue;

        // Generate QR code for the box
        const qrCode = `BOX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

        // Create the box
        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .insert({
            name: suggestion.boxName,
            qr_code: qrCode,
            inventory_id: inventoryId,
            user_id: user.id,
            box_size: suggestion.boxSize,
            dimensions: suggestion.dimensions,
            max_weight: suggestion.maxWeight,
            current_weight: suggestion.totalWeight,
            is_fragile: suggestion.isFragile,
            room: suggestion.room,
            notes: suggestion.reasoning,
          })
          .select()
          .single();

        if (boxError) {
          console.error('Error creating box:', boxError);
          continue;
        }

        // Update items to link to this box
        const itemIds = suggestion.items.map(item => item.id);
        if (itemIds.length > 0) {
          const { error: updateError } = await supabase
            .from('items')
            .update({ box_id: boxData.id })
            .in('id', itemIds);

          if (updateError) {
            console.error('Error updating items:', updateError);
          }
        }

        created.push({ id: boxData.id, name: boxData.name, qrCode, isFragile: suggestion.isFragile });
      }

      setCreatedBoxes(created);
      
      toast({
        title: "Boxes created!",
        description: `Successfully created ${created.length} boxes with QR codes.`,
      });

      onSuccess();

    } catch (error) {
      console.error('Error creating boxes:', error);
      toast({
        title: "Error",
        description: "Failed to create some boxes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-green-100 text-green-800';
      case 'large': return 'bg-orange-100 text-orange-800';
      case 'extra-large': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Smart Box Suggestions
          </DialogTitle>
          <DialogDescription>
            AI will analyze your items and suggest optimal box groupings. Each box gets one QR code for easy tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{unboxedItems.length} unboxed items</span>
            <span>{suggestions.length} suggestions</span>
            <span>{selectedSuggestions.size} selected</span>
          </div>

          {/* Generate button */}
          {suggestions.length === 0 && createdBoxes.length === 0 && (
            <Button 
              onClick={generateSuggestions} 
              disabled={isLoading || unboxedItems.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing items...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Box Suggestions
                </>
              )}
            </Button>
          )}

          {/* Created boxes with QR codes */}
          {createdBoxes.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Boxes Created Successfully!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdBoxes.map((box) => (
                  <Card key={box.id} className={`${box.isFragile ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <QRCodeSVG value={box.qrCode} size={100} />
                      <p className="font-medium text-sm text-center">{box.name}</p>
                      <Badge variant="outline">{box.qrCode}</Badge>
                      {box.isFragile && (
                        <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-md font-bold text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          FRAGILE
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSuggestions([]);
                  setCreatedBoxes([]);
                  setSelectedSuggestions(new Set());
                }}
                className="w-full"
              >
                Generate More Suggestions
              </Button>
            </div>
          )}

          {/* Suggestions list */}
          {suggestions.length > 0 && createdBoxes.length === 0 && (
            <>
              <div className="grid gap-4">
                {suggestions.map((suggestion, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedSuggestions.has(index) 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => toggleSuggestion(index)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedSuggestions.has(index)}
                            onCheckedChange={() => toggleSuggestion(index)}
                          />
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Box className="h-4 w-4" />
                              {suggestion.boxName}
                            </CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge className={getSizeColor(suggestion.boxSize)}>
                                {suggestion.boxSize}
                              </Badge>
                              <Badge variant="outline">{suggestion.dimensions}</Badge>
                              {suggestion.isFragile && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Fragile
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{suggestion.items.length} items</p>
                          <p>~{suggestion.totalWeight} lbs</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.items.slice(0, 5).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {suggestion.items.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{suggestion.items.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuggestions([]);
                    setSelectedSuggestions(new Set());
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createSelectedBoxes}
                  disabled={isCreating || selectedSuggestions.size === 0}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating boxes...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Create {selectedSuggestions.size} Boxes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
