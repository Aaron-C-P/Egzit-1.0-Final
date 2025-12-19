import { useState, useEffect } from 'react';
import { Truck, Package, MapPin, QrCode } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const featureImages = [
  {
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    icon: Truck,
    title: 'Smart Moving',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    icon: Package,
    title: 'Track Items',
  },
  {
    url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    icon: MapPin,
    title: 'Live Tracking',
  },
  {
    url: 'https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=800&q=80',
    icon: QrCode,
    title: 'QR Inventory',
  },
];

const SPLASH_SESSION_KEY = 'egzit_splash_shown';

export function checkSplashShown(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSplashShown(): void {
  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
  } catch {}
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    featureImages.forEach((img) => {
      const image = new Image();
      image.src = img.url;
    });
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 2));
    }, 60);

    const imageInterval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % featureImages.length);
    }, 750);

    const timer = setTimeout(() => {
      markSplashShown();
      onComplete();
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(imageInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    markSplashShown();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#FF0000] via-[#CC0000] to-[#990000]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {featureImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentImage ? 'opacity-30' : 'opacity-0'
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF0000]/80 via-transparent to-[#990000]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Truck className="h-10 w-10 text-[#FF0000]" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg">
            EGZIT
          </h1>
          <p className="text-white/90 mt-2 text-lg font-medium">
            Smart Moving. Simplified.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-4 gap-3 max-w-sm w-full mb-8">
          {featureImages.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = index === currentImage;
            return (
              <div
                key={index}
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-white scale-105 shadow-lg' : 'bg-white/20'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-[#FF0000]' : 'text-white'}`} />
                <span className={`text-[10px] font-medium text-center ${isActive ? 'text-[#FF0000]' : 'text-white/80'}`}>
                  {feature.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="text-white/80 text-sm hover:text-white transition-colors"
        >
          Skip →
        </button>

        {/* Credit */}
        <p className="absolute bottom-4 text-white/60 text-xs">
          Developed by <span className="font-semibold">Aaron Prince</span>
        </p>
      </div>
    </div>
  );
}
