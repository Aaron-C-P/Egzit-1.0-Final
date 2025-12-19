import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, XCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (qrCode: string) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scanner.stop();
        }
      } catch (err) {
        // Ignore stop errors - scanner may already be stopped
      }
      
      // Only attempt clear if the container still exists in DOM
      try {
        const container = document.getElementById('qr-reader');
        if (container && container.childNodes.length > 0) {
          scanner.clear();
        }
      } catch (err) {
        // Ignore clear errors - DOM may already be unmounted by React
      }
    }
    
    if (mountedRef.current) {
      setIsScanning(false);
      setIsInitializing(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    const container = document.getElementById('qr-reader');
    if (!container || !mountedRef.current) {
      console.log('Container not ready');
      return;
    }

    // Stop existing scanner if any
    await stopScanner();
    
    try {
      setError(null);
      setIsInitializing(true);
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!mountedRef.current) return;
      
      scannerRef.current = new Html5Qrcode('qr-reader');
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {} // Ignore errors during scanning
      );
      
      setIsScanning(true);
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setIsInitializing(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('No device')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Unable to start camera. Please check camera permissions and try again.');
      }
      setIsScanning(false);
    }
  }, [stopScanner]);

  const handleScan = async (decodedText: string) => {
    await stopScanner();
    
    if (decodedText.startsWith('EGZIT-ITEM-')) {
      onScan(decodedText);
      onOpenChange(false);
    } else {
      toast.error('Invalid QR code. Please scan an EGZIT item QR code.');
      // Restart scanner after invalid scan
      setTimeout(() => {
        if (mountedRef.current) {
          startScanner();
        }
      }, 1000);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      mountedRef.current = true;
      // Delay to ensure dialog content is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      mountedRef.current = false;
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={startScanner}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div 
                id="qr-reader" 
                className="w-full aspect-square rounded-lg overflow-hidden bg-muted relative"
              >
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Starting camera...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {isScanning 
                  ? 'Point your camera at an EGZIT item QR code'
                  : 'Initializing camera...'}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
