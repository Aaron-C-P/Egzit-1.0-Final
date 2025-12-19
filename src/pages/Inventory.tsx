import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Grid, List, ScanLine, Upload, Search, Package, Camera, BoxIcon, ScanBarcode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { QRScanner } from '@/components/inventory/QRScanner';
import { BulkImportDialog } from '@/components/inventory/BulkImportDialog';
import { BoxSuggestionsDialog } from '@/components/inventory/BoxSuggestionsDialog';
import { BoxQRScanner } from '@/components/inventory/BoxQRScanner';
import CVScanner from '@/components/inventory/CVScanner';
import { AppLayout } from '@/components/navigation/AppLayout';
import { Tables } from '@/integrations/supabase/types';

type Item = Tables<'items'>;

export default function Inventory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCVScannerOpen, setIsCVScannerOpen] = useState(false);
  const [isBoxSuggestionsOpen, setIsBoxSuggestionsOpen] = useState(false);
  const [isBoxScannerOpen, setIsBoxScannerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Get user's inventories first
      const { data: inventories, error: invError } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user?.id);

      if (invError) throw invError;

      if (!inventories || inventories.length === 0) {
        setItems([]);
        return;
      }

      // Get items from user's inventories
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .in('inventory_id', inventories.map(inv => inv.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.room?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQRScan = async (qrCode: string) => {
    // Find item by QR code
    const item = items.find(i => i.qr_code === qrCode);
    if (item) {
      navigate(`/inventory/${item.id}`);
    } else {
      // Try to find in database
      const { data, error } = await supabase
        .from('items')
        .select('id')
        .eq('qr_code', qrCode)
        .maybeSingle();
      
      if (data) {
        navigate(`/inventory/${data.id}`);
      } else {
        toast.error('Item not found for this QR code');
      }
    }
  };

  const handleBulkPrintQR = () => {
    if (filteredItems.length === 0) {
      toast.error('No items to print');
      return;
    }

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    // Generate QR codes HTML
    const qrCodesHtml = filteredItems.map(item => `
      <div class="qr-item">
        <h3>${item.name}</h3>
        <div class="qr-placeholder" data-qr="${item.qr_code || item.id}"></div>
        <p class="qr-code-text">${item.qr_code || ''}</p>
        ${item.room ? `<p class="room">Room: ${item.room}</p>` : ''}
      </div>
    `).join('');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All QR Codes - EGZIT Inventory</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .qr-item {
              border: 2px solid #000;
              padding: 15px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-item h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
            }
            .qr-placeholder {
              display: flex;
              justify-content: center;
              margin: 10px 0;
            }
            .qr-code-text {
              font-size: 10px;
              color: #666;
              word-break: break-all;
            }
            .room {
              font-size: 11px;
              color: #333;
            }
            @media print {
              body { padding: 10px; }
              .grid { gap: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>EGZIT Inventory QR Codes</h1>
          <div class="grid">
            ${qrCodesHtml}
          </div>
          <script>
            document.querySelectorAll('.qr-placeholder').forEach(el => {
              const qrValue = el.getAttribute('data-qr');
              if (qrValue) {
                new QRCode(el, {
                  text: qrValue,
                  width: 100,
                  height: 100,
                  correctLevel: QRCode.CorrectLevel.H
                });
              }
            });
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for QR codes to render then print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);

    toast.success(`Printing ${filteredItems.length} QR codes...`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading inventory...</div>
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
            <h1 className="text-2xl font-bold mb-1">My Inventory</h1>
            <p className="text-primary-foreground/80">
              {items.length} {items.length === 1 ? 'item' : 'items'} cataloged
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="px-4 -mt-4 max-w-lg mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl shadow-card bg-card"
            />
          </div>

          {/* Pack Boxes CTA - More Prominent */}
          {items.length > 0 && (
            <Card 
              className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setIsBoxSuggestionsOpen(true)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BoxIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    📦 Ready to Pack?
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Powered</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Let AI suggest optimal box groupings for your {items.length} items
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1 min-w-[120px]">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsCVScannerOpen(true)} title="AI Scanner">
              <Camera className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)} title="Scan Item QR">
              <ScanLine className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsBoxScannerOpen(true)} title="Scan Box QR">
              <ScanBarcode className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsBulkImportOpen(true)} title="Bulk Import">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleBulkPrintQR} title="Print All QR Codes">
              <Printer className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Items List */}
        <div className="px-4 mt-4 max-w-lg mx-auto pb-6">
          {filteredItems.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">
                  {searchQuery ? 'No items found' : 'No items yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search' 
                    : 'Start by adding your first item'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 gap-3' 
              : 'space-y-3'
            }>
              {filteredItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <ItemCard item={item} onUpdate={fetchItems} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchItems}
      />

      <QRScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQRScan}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onSuccess={fetchItems}
      />

      <CVScanner
        open={isCVScannerOpen}
        onOpenChange={setIsCVScannerOpen}
        onItemDetected={async (item) => {
          // Open add dialog with pre-filled data
          setIsAddDialogOpen(true);
          toast.success(`Detected: ${item.name}`, {
            description: `Category: ${item.category}`,
          });
        }}
      />

      <BoxSuggestionsDialog
        open={isBoxSuggestionsOpen}
        onOpenChange={setIsBoxSuggestionsOpen}
        items={items}
        onSuccess={fetchItems}
      />

      <BoxQRScanner
        open={isBoxScannerOpen}
        onOpenChange={setIsBoxScannerOpen}
        onItemUpdate={fetchItems}
      />
    </AppLayout>
  );
}
