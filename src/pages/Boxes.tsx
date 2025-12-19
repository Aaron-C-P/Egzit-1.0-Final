import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Box, Package, Search, AlertTriangle, CheckCircle, 
  Printer, Trash2, ChevronRight, Plus, ScanBarcode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BoxItem {
  id: string;
  name: string;
  packed: boolean | null;
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
  created_at: string;
  items: BoxItem[];
}

export default function Boxes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [boxToDelete, setBoxToDelete] = useState<BoxData | null>(null);

  useEffect(() => {
    if (user) {
      fetchBoxes();
    }
  }, [user]);

  const fetchBoxes = async () => {
    try {
      setLoading(true);
      
      const { data: boxesData, error: boxesError } = await supabase
        .from('boxes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (boxesError) throw boxesError;

      // Fetch items for each box
      const boxesWithItems = await Promise.all(
        (boxesData || []).map(async (box) => {
          const { data: items } = await supabase
            .from('items')
            .select('id, name, packed')
            .eq('box_id', box.id);
          
          return {
            ...box,
            items: items || []
          };
        })
      );

      setBoxes(boxesWithItems);
    } catch (error) {
      console.error('Error fetching boxes:', error);
      toast.error('Failed to load boxes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBox = async () => {
    if (!boxToDelete) return;

    try {
      // First, unlink items from this box
      await supabase
        .from('items')
        .update({ box_id: null })
        .eq('box_id', boxToDelete.id);

      // Then delete the box
      const { error } = await supabase
        .from('boxes')
        .delete()
        .eq('id', boxToDelete.id);

      if (error) throw error;

      toast.success('Box deleted successfully');
      setShowDeleteConfirm(false);
      setBoxToDelete(null);
      setSelectedBox(null);
      fetchBoxes();
    } catch (error) {
      console.error('Error deleting box:', error);
      toast.error('Failed to delete box');
    }
  };

  const handlePrintLabel = (box: BoxData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Box Label - ${box.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .label {
              border: 3px solid #000;
              padding: 20px;
              text-align: center;
              max-width: 400px;
            }
            .box-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .room {
              font-size: 18px;
              color: #666;
              margin-bottom: 15px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-code svg {
              width: 150px;
              height: 150px;
            }
            .code {
              font-size: 14px;
              color: #888;
              margin-bottom: 10px;
            }
            .fragile {
              background: #dc2626;
              color: white;
              padding: 10px 20px;
              font-size: 20px;
              font-weight: bold;
              margin-top: 15px;
              display: inline-block;
            }
            .items-count {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="box-name">${box.name}</div>
            ${box.room ? `<div class="room">${box.room}</div>` : ''}
            <div class="qr-code" id="qr-container"></div>
            <div class="code">${box.qr_code || ''}</div>
            <div class="items-count">${box.items.length} items</div>
            ${box.is_fragile ? '<div class="fragile">⚠️ FRAGILE</div>' : ''}
          </div>
          <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.createElement('canvas'), '${box.qr_code}', function (error, canvas) {
              if (error) console.error(error);
              canvas.style.width = '150px';
              canvas.style.height = '150px';
              document.getElementById('qr-container').appendChild(canvas);
              setTimeout(() => window.print(), 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredBoxes = boxes.filter(box =>
    box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    box.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    box.qr_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = boxes.reduce((sum, box) => sum + box.items.length, 0);
  const packedItems = boxes.reduce((sum, box) => 
    sum + box.items.filter(item => item.packed).length, 0
  );
  const overallProgress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  const getSizeColor = (size: string | null) => {
    switch (size) {
      case 'small': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-green-100 text-green-800';
      case 'large': return 'bg-orange-100 text-orange-800';
      case 'extra-large': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading boxes...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-hero text-primary-foreground px-4 pt-12 pb-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-1">My Boxes</h1>
            <p className="text-primary-foreground/80">
              {boxes.length} {boxes.length === 1 ? 'box' : 'boxes'} • {totalItems} items
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="px-4 -mt-4 max-w-lg mx-auto">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Packing Progress</span>
                <span className="text-sm text-muted-foreground">{packedItems}/{totalItems} items</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(overallProgress)}% complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions */}
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, room, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl shadow-card bg-card"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => navigate('/inventory')} variant="outline" className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Add Items
            </Button>
            <Button onClick={() => navigate('/inventory')} variant="secondary" className="flex-1">
              <Box className="mr-2 h-4 w-4" />
              Pack More Boxes
            </Button>
          </div>
        </div>

        {/* Boxes List */}
        <div className="px-4 mt-4 max-w-lg mx-auto pb-6 space-y-3">
          {filteredBoxes.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">
                  {searchQuery ? 'No boxes found' : 'No boxes yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search' 
                    : 'Add items to your inventory and use "Pack Boxes" to create smart groupings'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/inventory')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Go to Inventory
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredBoxes.map((box, index) => {
              const itemCount = box.items.length;
              const packedCount = box.items.filter(i => i.packed).length;
              const progress = itemCount > 0 ? (packedCount / itemCount) * 100 : 0;
              const isComplete = progress === 100;

              return (
                <Card 
                  key={box.id}
                  className={`shadow-soft cursor-pointer transition-all hover:shadow-md animate-fade-in ${
                    box.is_fragile ? 'border-l-4 border-l-red-500' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedBox(box)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* QR Code Preview */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        {box.qr_code && (
                          <QRCodeSVG value={box.qr_code} size={60} />
                        )}
                        {box.is_fragile && (
                          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded mt-1 font-bold">
                            FRAGILE
                          </span>
                        )}
                      </div>

                      {/* Box Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium truncate">{box.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {box.box_size && (
                                <Badge className={`text-xs ${getSizeColor(box.box_size)}`}>
                                  {box.box_size}
                                </Badge>
                              )}
                              {box.room && (
                                <Badge variant="outline" className="text-xs">
                                  {box.room}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{itemCount} items</span>
                            <span className={isComplete ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              {isComplete ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                `${packedCount}/${itemCount} packed`
                              )}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Box Detail Dialog */}
      <Dialog open={!!selectedBox} onOpenChange={(open) => !open && setSelectedBox(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedBox && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {selectedBox.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedBox.room && `${selectedBox.room} • `}
                  {selectedBox.items.length} items
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex flex-col items-center py-4 bg-muted/50 rounded-lg">
                  {selectedBox.qr_code && (
                    <QRCodeSVG value={selectedBox.qr_code} size={120} />
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{selectedBox.qr_code}</p>
                  {selectedBox.is_fragile && (
                    <div className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-md font-bold text-sm mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      FRAGILE
                    </div>
                  )}
                </div>

                {/* Box details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedBox.box_size && (
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="ml-2 font-medium">{selectedBox.box_size}</span>
                    </div>
                  )}
                  {selectedBox.dimensions && (
                    <div>
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span className="ml-2 font-medium">{selectedBox.dimensions}</span>
                    </div>
                  )}
                  {selectedBox.current_weight && (
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-2 font-medium">~{selectedBox.current_weight} lbs</span>
                    </div>
                  )}
                </div>

                {/* Items list */}
                <div>
                  <h4 className="font-medium mb-2">Items in this box:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedBox.items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30"
                      >
                        {item.packed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 border rounded-full" />
                        )}
                        <span className={item.packed ? 'line-through text-muted-foreground' : ''}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedBox.notes && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                    <strong>Notes:</strong> {selectedBox.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePrintLabel(selectedBox)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => {
                      setBoxToDelete(selectedBox);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Box?</DialogTitle>
            <DialogDescription>
              This will delete the box "{boxToDelete?.name}" but keep the items in your inventory. 
              The items will no longer be assigned to any box.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBox}>
              Delete Box
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
