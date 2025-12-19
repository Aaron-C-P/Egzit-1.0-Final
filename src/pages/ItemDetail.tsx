import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Package, MapPin, Weight, Printer, Trash2, Edit, CheckCircle2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Tables } from '@/integrations/supabase/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EditItemDialog } from '@/components/inventory/EditItemDialog';
import { AppLayout } from '@/components/navigation/AppLayout';

type Item = Tables<'items'>;

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const qrCodeElement = document.getElementById('qr-code-print');
    if (!qrCodeElement) return;

    // Create a hidden iframe for printing to avoid multi-display issues
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

    const fragileHtml = item?.fragile ? `
      <div class="fragile-warning">
        ⚠️ FRAGILE - HANDLE WITH CARE
      </div>
    ` : '';

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${item?.name}</title>
          <style>
            @media print {
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 3px solid ${item?.fragile ? '#dc2626' : '#000'};
                ${item?.fragile ? 'background-color: #fef2f2;' : ''}
              }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .logo span { color: #2563eb; }
              h2 { margin: 0 0 15px 0; font-size: 18px; }
              svg { margin: 15px 0; }
              .fragile-warning {
                background-color: #dc2626;
                color: white;
                padding: 10px 20px;
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 15px;
                border-radius: 4px;
              }
              .qr-id { font-size: 12px; color: #666; margin-top: 15px; }
            }
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 3px solid ${item?.fragile ? '#dc2626' : '#000'};
              ${item?.fragile ? 'background-color: #fef2f2;' : ''}
            }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .logo span { color: #2563eb; }
            h2 { margin: 0 0 15px 0; font-size: 18px; }
            svg { margin: 15px 0; }
            .fragile-warning {
              background-color: #dc2626;
              color: white;
              padding: 10px 20px;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 15px;
              border-radius: 4px;
            }
            .qr-id { font-size: 12px; color: #666; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="logo">EGZ<span>IT</span></div>
            ${fragileHtml}
            <h2>${item?.name}</h2>
            ${qrCodeElement.innerHTML}
            <p class="qr-id">${item?.qr_code}</p>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to render then print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  const handleDownloadQR = () => {
    const qrCodeElement = document.getElementById('qr-code-print');
    if (!qrCodeElement) return;

    const svgElement = qrCodeElement.querySelector('svg');
    if (!svgElement) return;

    // Create a canvas to convert SVG to PNG with branding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrSize = 320; // QR code size
    const padding = 40;
    const headerHeight = item?.fragile ? 120 : 80;
    const footerHeight = 50;
    
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + headerHeight + footerHeight;
    
    // Background
    ctx.fillStyle = item?.fragile ? '#fef2f2' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = item?.fragile ? '#dc2626' : '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Logo - EGZIT
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('EGZ', canvas.width / 2 - 20, 40);
    ctx.fillStyle = '#2563eb';
    ctx.fillText('IT', canvas.width / 2 + 35, 40);
    
    // Fragile warning
    let currentY = 60;
    if (item?.fragile) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(padding, currentY, canvas.width - padding * 2, 35);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('⚠️ FRAGILE - HANDLE WITH CARE', canvas.width / 2, currentY + 24);
      currentY += 45;
    }
    
    // Item name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(item?.name || 'Item', canvas.width / 2, currentY + 20);
    
    // Draw QR code
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const qrY = headerHeight + padding;
      ctx.drawImage(img, padding, qrY, qrSize, qrSize);
      
      // QR ID at bottom
      ctx.fillStyle = '#666666';
      ctx.font = '11px Arial';
      ctx.fillText(item?.qr_code || '', canvas.width / 2, canvas.height - 15);
      
      // Download the PNG
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-${item?.name?.replace(/\s+/g, '-') || 'code'}${item?.fragile ? '-FRAGILE' : ''}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded!');
    };
    img.src = url;
  };

  const handleDelete = async () => {
    if (!item || !confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item deleted successfully');
      navigate('/inventory');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const togglePacked = async () => {
    if (!item) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ packed: !item.packed })
        .eq('id', item.id);

      if (error) throw error;

      setItem({ ...item, packed: !item.packed });
      toast.success(item.packed ? 'Marked as unpacked' : 'Marked as packed');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading item details...</div>
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return null;
  }

  const notes = (item.meta as any)?.notes;

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-card border-b px-4 pt-4 pb-3 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{item.name}</h1>
              {item.category && (
                <p className="text-sm text-muted-foreground">{item.category}</p>
              )}
            </div>
            {item.packed && (
              <Badge className="bg-accent text-accent-foreground shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Packed
              </Badge>
            )}
          </div>
        </div>

        <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
          {/* Image */}
          {item.image_url && (
            <Card className="overflow-hidden shadow-soft animate-fade-in">
              <CardContent className="p-0">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-64 object-cover"
                />
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardContent className="p-4 space-y-4">
              {item.room && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="font-medium">{item.room}</p>
                  </div>
                </div>
              )}

              {item.category && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{item.category}</p>
                  </div>
                </div>
              )}

              {item.weight && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Weight className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-medium">{item.weight} lbs</p>
                  </div>
                </div>
              )}

              {item.fragile && (
                <Badge variant="destructive" className="mt-2">Fragile Item</Badge>
              )}

              {/* Packed Toggle */}
              <div className="flex items-center justify-between py-3 border-t">
                <Label htmlFor="packed-toggle" className="cursor-pointer font-medium">
                  Packed Status
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.packed ? 'Packed' : 'Not Packed'}
                  </span>
                  <Switch
                    id="packed-toggle"
                    checked={item.packed || false}
                    onCheckedChange={togglePacked}
                  />
                </div>
              </div>

              {notes && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card className="shadow-soft animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div id="qr-code-print" className="flex justify-center mb-4">
                <QRCodeSVG
                  value={item.qr_code || ''}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {item && (
        <EditItemDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={item}
          onSuccess={fetchItem}
        />
      )}
    </AppLayout>
  );
}
