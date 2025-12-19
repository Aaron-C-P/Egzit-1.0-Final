import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Package, 
  QrCode, 
  Camera, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Scan,
  Image as ImageIcon,
  Star,
  Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureDemo {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const VideoDemos = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("smart-inventory");

  const features: FeatureDemo[] = [
    {
      id: "smart-inventory",
      title: "Smart Inventory",
      description: "AI-powered item cataloging with automatic categorization",
      icon: Package,
    },
    {
      id: "qr-tracking",
      title: "QR Tracking",
      description: "Scan & locate items using QR codes",
      icon: QrCode,
    },
    {
      id: "photo-import",
      title: "Photo Import",
      description: "Bulk capture items via camera",
      icon: Camera,
    },
    {
      id: "add-items",
      title: "Add Items",
      description: "Manual and quick item entry",
      icon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/presentation")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Feature Demos</h1>
              <p className="text-sm text-muted-foreground">Visual mockups of app features</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            {features.map((feature) => (
              <TabsTrigger key={feature.id} value={feature.id} className="gap-2">
                <feature.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{feature.title.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Smart Inventory Demo */}
          <TabsContent value="smart-inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">Smart Inventory Dashboard</h2>
                    <p className="text-sm text-muted-foreground font-normal">AI-powered item management</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mockup Screenshot */}
                <div className="border rounded-xl overflow-hidden bg-background shadow-lg">
                  {/* Header */}
                  <div className="bg-card border-b p-4 flex items-center justify-between">
                    <h3 className="font-semibold">My Items</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline"><Search className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline"><Filter className="w-4 h-4" /></Button>
                      <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
                    </div>
                  </div>
                  
                  {/* Room Tabs */}
                  <div className="bg-muted/50 p-2 flex gap-2 overflow-x-auto">
                    {["All Items", "Living Room", "Bedroom", "Kitchen", "Bathroom"].map((room, i) => (
                      <Badge key={room} variant={i === 0 ? "default" : "outline"} className="whitespace-nowrap">
                        {room}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Items Grid */}
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "Samsung TV 55\"", room: "Living Room", packed: true, fragile: true },
                      { name: "Leather Sofa", room: "Living Room", packed: false, fragile: false },
                      { name: "Coffee Table", room: "Living Room", packed: true, fragile: false },
                      { name: "Floor Lamp", room: "Bedroom", packed: false, fragile: true },
                      { name: "Bookshelf", room: "Living Room", packed: false, fragile: false },
                      { name: "Kitchen Mixer", room: "Kitchen", packed: true, fragile: true },
                      { name: "Dining Chairs (4)", room: "Kitchen", packed: true, fragile: false },
                      { name: "Bathroom Cabinet", room: "Bathroom", packed: false, fragile: false },
                    ].map((item, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.room}</p>
                          <div className="flex gap-1 mt-2">
                            {item.packed && (
                              <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Packed
                              </Badge>
                            )}
                            {item.fragile && (
                              <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Fragile
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Stats Bar */}
                  <div className="border-t p-4 bg-muted/30 flex items-center justify-between">
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">48</p>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">32</p>
                        <p className="text-xs text-muted-foreground">Packed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">12</p>
                        <p className="text-xs text-muted-foreground">Fragile</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <Progress value={67} className="w-32 h-2" />
                      <span className="text-sm font-medium">67%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Tracking Demo */}
          <TabsContent value="qr-tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">QR Tracking System</h2>
                    <p className="text-sm text-muted-foreground font-normal">Scan & locate items instantly</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Scanner View */}
                  <div className="border rounded-xl overflow-hidden bg-background shadow-lg">
                    <div className="bg-card border-b p-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Scan className="w-5 h-5" /> QR Scanner
                      </h3>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-muted to-background flex flex-col items-center justify-center p-8">
                      <div className="w-48 h-48 border-4 border-dashed border-primary/50 rounded-2xl flex items-center justify-center relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        <QrCode className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground mt-4 text-center">Position QR code within frame</p>
                    </div>
                  </div>
                  
                  {/* Scan Result */}
                  <div className="border rounded-xl overflow-hidden bg-background shadow-lg">
                    <div className="bg-accent/10 border-b p-4">
                      <h3 className="font-semibold text-accent flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Item Found!
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                          <Box className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">Kitchen Box #3</h4>
                          <p className="text-muted-foreground">8 items • 12.5 kg</p>
                          <Badge className="mt-1 bg-warning/20 text-warning border-warning/30">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Fragile
                          </Badge>
                        </div>
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-sm font-medium">Contents:</p>
                        {["Coffee Maker", "Plates (set of 6)", "Wine Glasses", "Cutting Board"].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <Button className="w-full">Print Label</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Import Demo */}
          <TabsContent value="photo-import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">Photo Import - Bulk Capture</h2>
                    <p className="text-sm text-muted-foreground font-normal">Import items via photos with AI recognition</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-xl overflow-hidden bg-background shadow-lg">
                  {/* Camera View */}
                  <div className="bg-card border-b p-4 flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Camera className="w-5 h-5" /> Bulk Import
                    </h3>
                    <Badge variant="secondary">12 photos captured</Badge>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Captured Photos Grid */}
                    <div>
                      <p className="text-sm font-medium mb-3">Captured Items:</p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden border">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                            <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-accent-foreground" />
                            </div>
                          </div>
                        ))}
                        <div className="aspect-square border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Recognition Results */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning" /> AI Recognition Results:
                      </p>
                      <div className="space-y-2">
                        {[
                          { name: "Microwave Oven", category: "Kitchen", confidence: 98 },
                          { name: "Desk Lamp", category: "Office", confidence: 95 },
                          { name: "Coffee Table", category: "Living Room", confidence: 92 },
                          { name: "Monitor Stand", category: "Office", confidence: 89 },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-accent" />
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.category}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{item.confidence}% match</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">Retake Photos</Button>
                      <Button className="flex-1">Confirm & Add All</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Items Demo */}
          <TabsContent value="add-items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">Add Items</h2>
                    <p className="text-sm text-muted-foreground font-normal">Manual and quick item entry</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-xl overflow-hidden bg-background shadow-lg max-w-md mx-auto">
                  <div className="bg-card border-b p-4">
                    <h3 className="font-semibold">Add New Item</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Photo Upload */}
                    <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <Camera className="w-10 h-10 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Tap to add photo</p>
                    </div>
                    
                    {/* Form Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Item Name</label>
                        <div className="h-10 rounded-md border bg-muted/50 px-3 flex items-center text-muted-foreground">
                          Samsung 55" Smart TV
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Category</label>
                          <div className="h-10 rounded-md border bg-muted/50 px-3 flex items-center text-muted-foreground text-sm">
                            Electronics
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Room</label>
                          <div className="h-10 rounded-md border bg-muted/50 px-3 flex items-center text-muted-foreground text-sm">
                            Living Room
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 py-2">
                        <label className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded border-2 border-warning bg-warning flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-warning-foreground" />
                          </div>
                          Fragile Item
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded border-2 border-muted-foreground" />
                          Priority Item
                        </label>
                      </div>
                    </div>
                    
                    {/* QR Code Preview */}
                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">QR Code</p>
                        <p className="text-xs text-muted-foreground">Auto-generated</p>
                      </div>
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-foreground" />
                      </div>
                    </div>
                    
                    <Button className="w-full">Add Item</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VideoDemos;
