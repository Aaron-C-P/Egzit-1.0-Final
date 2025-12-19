import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Package, CheckCircle, Circle, AlertTriangle, Camera, X, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BoxItem {
  id: string;
  name: string;
  category: string | null;
  room: string | null;
  packed: boolean | null;
  fragile: boolean | null;
  image_url: string | null;
}

interface BoxData {
  id: string;
  name: string;
  qr_code: string | null;
  box_size: string | null;
  dimensions: string | null;
  current_weight: number | null;
  max_weight: number | null;
  is_fragile: boolean | null;
  room: string | null;
  notes: string | null;
  items: BoxItem[];
}

interface BoxQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdate?: () => void;
}

export function BoxQRScanner({ open, onOpenChange, onItemUpdate }: BoxQRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [boxData, setBoxData] = useState<BoxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;

    if (open && scanning) {
      html5Qrcode = new Html5Qrcode("box-qr-reader");
      
      html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleQRCode(decodedText);
          if (html5Qrcode) {
            await html5Qrcode.stop();
          }
          setScanning(false);
        },
        () => {} // Ignore errors during scanning
      ).catch(err => {
        console.error('Error starting scanner:', err);
        setScanning(false);
      });
    }

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(console.error);
      }
    };
  }, [open, scanning]);

  const handleQRCode = async (qrCode: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Find box by QR code
      const { data: box, error: boxError } = await supabase
        .from('boxes')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('user_id', user.id)
        .maybeSingle();

      if (boxError) throw boxError;
      
      if (!box) {
        setBoxData(null);
        return;
      }

      // Get items in this box
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, name, category, room, packed, fragile, image_url')
        .eq('box_id', box.id);

      if (itemsError) throw itemsError;

      setBoxData({
        ...box,
        items: items || []
      });

    } catch (error) {
      console.error('Error fetching box:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (manualCode.trim()) {
      await handleQRCode(manualCode.trim().toUpperCase());
    }
  };

  const toggleItemPacked = async (itemId: string, currentPacked: boolean | null) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ packed: !currentPacked })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      if (boxData) {
        setBoxData({
          ...boxData,
          items: boxData.items.map(item =>
            item.id === itemId ? { ...item, packed: !currentPacked } : item
          )
        });
      }

      onItemUpdate?.();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const getSizeColor = (size: string | null) => {
    switch (size) {
      case 'small': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-green-100 text-green-800';
      case 'large': return 'bg-orange-100 text-orange-800';
      case 'extra-large': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const packedCount = boxData?.items.filter(item => item.packed).length || 0;
  const totalItems = boxData?.items.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Scan Box QR Code
          </DialogTitle>
          <DialogDescription>
            Scan a box QR code to see all items inside and their status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Manual entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter box code (e.g., BOX-A1B2C3D4)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <Button onClick={handleManualSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Scanner toggle */}
          {!boxData && (
            <div className="relative">
              {scanning ? (
                <div className="space-y-2">
                  <div id="box-qr-reader" className="rounded-lg overflow-hidden" />
                  <Button 
                    variant="outline" 
                    onClick={() => setScanning(false)}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setScanning(true)}
                  variant="outline"
                  className="w-full h-32 flex-col gap-2"
                >
                  <Camera className="h-8 w-8" />
                  <span>Tap to Scan QR Code</span>
                </Button>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading box contents...
            </div>
          )}

          {/* Box details */}
          {boxData && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {boxData.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {boxData.box_size && (
                        <Badge className={getSizeColor(boxData.box_size)}>
                          {boxData.box_size}
                        </Badge>
                      )}
                      {boxData.dimensions && (
                        <Badge variant="outline">{boxData.dimensions}</Badge>
                      )}
                      {boxData.is_fragile && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Fragile
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    {boxData.qr_code && (
                      <QRCodeSVG value={boxData.qr_code} size={60} />
                    )}
                    <span className="text-xs text-muted-foreground mt-1">
                      {boxData.qr_code}
                    </span>
                    {boxData.is_fragile && (
                      <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        FRAGILE
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Packing progress</span>
                  <span className="font-medium">
                    {packedCount}/{totalItems} items packed
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${totalItems > 0 ? (packedCount / totalItems) * 100 : 0}%` }}
                  />
                </div>

                {/* Weight info */}
                {boxData.current_weight && boxData.max_weight && (
                  <div className="text-sm text-muted-foreground">
                    Weight: ~{boxData.current_weight} lbs / {boxData.max_weight} lbs max
                  </div>
                )}

                {/* Room */}
                {boxData.room && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Room: </span>
                    <span>{boxData.room}</span>
                  </div>
                )}

                {/* Notes */}
                {boxData.notes && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {boxData.notes}
                  </div>
                )}

                {/* Items list */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Items in this box:</h4>
                  {boxData.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items in this box yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {boxData.items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleItemPacked(item.id, item.packed)}
                        >
                          {item.packed ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                          
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${item.packed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.name}
                            </p>
                            <div className="flex gap-2">
                              {item.category && (
                                <span className="text-xs text-muted-foreground">{item.category}</span>
                              )}
                              {item.fragile && (
                                <Badge variant="outline" className="text-xs h-4 px-1">
                                  <AlertTriangle className="h-2 w-2 mr-0.5" />
                                  Fragile
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scan another */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBoxData(null);
                    setManualCode('');
                  }}
                  className="w-full"
                >
                  Scan Another Box
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
