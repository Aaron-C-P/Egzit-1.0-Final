import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Home,
  Package,
  QrCode,
  Truck,
  MapPin,
  Shield,
  Bell,
  BarChart3,
  Users,
  Smartphone,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Heart,
  Star,
  ArrowRight,
  Box,
  Camera,
  Route,
  CreditCard,
  MessageSquare,
  FileText,
  Layers,
  Globe,
  Lock,
  TrendingUp,
  Lightbulb,
  Presentation as PresentationIcon,
  Maximize,
  Minimize,
  Download,
  Share2,
  Copy,
  Database,
  Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import egzitLogo from "@/assets/egzit-logo.png";
import schemaImage from "@/assets/supabase-schema.png";
interface Slide {
  id: number;
  type: "title" | "problem" | "solution" | "feature" | "flow" | "tech" | "demo" | "closing";
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  speakerNotes?: string;
}

const Presentation = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSlide = parseInt(searchParams.get("slide") || "1") - 1;
  const [currentSlide, setCurrentSlide] = useState(Math.max(0, initialSlide));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);

  const slides: Slide[] = [
    // Slide 1: Title
    {
      id: 1,
      type: "title",
      title: "EGZIT",
      subtitle: "AI-Powered Smart Moving Assistant",
      content: (
        <div className="flex flex-col items-center gap-8 animate-fade-in-up">
          <img src={egzitLogo} alt="EGZIT Logo" className="w-48 h-auto" />
          <div className="text-center space-y-4">
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Transforming Chaotic Moves into Streamlined, Intelligent Processes
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-center">
            <Badge variant="outline" className="px-4 py-2 text-sm">React + Vite</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">Supabase</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">AI-Powered</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">PWA</Badge>
          </div>
        </div>
      ),
      speakerNotes: "Welcome to EGZIT - a comprehensive moving assistant that uses AI to revolutionize the relocation experience.",
    },

    // Slide 2: The Problem
    {
      id: 2,
      type: "problem",
      title: "The Moving Problem",
      subtitle: "Why Traditional Moving Fails",
      content: (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              Current Pain Points
            </h3>
            <div className="space-y-4">
              {[
                { stat: "30%", label: "of movers forget essential items" },
                { stat: "45%", label: "struggle with organization" },
                { stat: "60%", label: "experience item damage" },
                { stat: "$1,250", label: "average cost overruns" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                  <span className="text-3xl font-bold text-destructive">{item.stat}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Key Challenges
            </h3>
            <div className="space-y-3">
              {[
                "No centralized inventory tracking",
                "Poor packing strategies",
                "Lack of real-time visibility",
                "Inefficient route planning",
                "Difficult mover coordination",
                "Lost or damaged valuables",
              ].map((challenge, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>{challenge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      speakerNotes: "Moving is stressful. 30% forget essentials, 45% struggle with organization. These statistics highlight the need for a smarter solution.",
    },

    // Slide 3: The Solution
    {
      id: 3,
      type: "solution",
      title: "Introducing EGZIT",
      subtitle: "Your AI-Powered Moving Companion",
      content: (
        <div className="space-y-8 animate-fade-in-up">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xl text-muted-foreground">
              EGZIT combines artificial intelligence, real-time tracking, and cloud-based logistics 
              to transform how people move.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI-Powered",
                description: "Smart categorization, packing recommendations, and item recognition",
                color: "text-primary",
              },
              {
                icon: QrCode,
                title: "QR Tracking",
                description: "Scan-based inventory management and real-time item location",
                color: "text-accent",
              },
              {
                icon: Truck,
                title: "Smart Logistics",
                description: "Route optimization and mover marketplace integration",
                color: "text-warning",
              },
            ].map((feature, i) => (
              <Card key={i} className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ),
      speakerNotes: "EGZIT solves these problems with three core pillars: AI intelligence, QR-based tracking, and smart logistics management.",
    },

    // Slide 4: Core Features Overview
    {
      id: 4,
      type: "feature",
      title: "Core Features",
      subtitle: "Complete Moving Ecosystem",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
          {[
            { icon: Package, label: "Smart Inventory", desc: "AI-powered cataloging" },
            { icon: Box, label: "Box Management", desc: "Optimal packing" },
            { icon: QrCode, label: "QR Tracking", desc: "Scan & locate" },
            { icon: Camera, label: "Photo Import", desc: "Bulk capture" },
            { icon: Brain, label: "AI Assistant", desc: "Packing tips" },
            { icon: Truck, label: "Mover Market", desc: "Find & book" },
            { icon: Route, label: "Route Planning", desc: "Optimized paths" },
            { icon: MapPin, label: "Live Tracking", desc: "Real-time GPS" },
            { icon: CreditCard, label: "Payments", desc: "Secure checkout" },
            { icon: Bell, label: "Reminders", desc: "Never forget" },
            { icon: MessageSquare, label: "Chat", desc: "Mover comms" },
            { icon: BarChart3, label: "Analytics", desc: "Move insights" },
          ].map((feature, i) => (
            <Card key={i} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h5 className="font-semibold text-sm">{feature.label}</h5>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
      speakerNotes: "These 12 core features work together to provide a complete moving ecosystem - from initial inventory to final delivery confirmation.",
    },

    // Slide 5: Inventory System
    {
      id: 5,
      type: "demo",
      title: "Smart Inventory System",
      subtitle: "AI-Powered Item Management",
      content: (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Inventory Dashboard
              </h4>
              <div className="space-y-3">
                {[
                  { room: "Living Room", items: 24, packed: 18 },
                  { room: "Bedroom", items: 32, packed: 32 },
                  { room: "Kitchen", items: 45, packed: 12 },
                  { room: "Bathroom", items: 15, packed: 15 },
                ].map((room, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{room.room}</span>
                    <div className="flex items-center gap-3">
                      <Progress value={(room.packed / room.items) * 100} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground">{room.packed}/{room.items}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Key Capabilities</h4>
            <ul className="space-y-3">
              {[
                "Photo-based item capture with AI recognition",
                "Automatic category suggestions",
                "Room-by-room organization",
                "Bulk import via camera",
                "QR code generation per item",
                "Weight and fragility tracking",
                "Search and filter functionality",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
      speakerNotes: "The inventory system is the heart of EGZIT. Users can add items via photos, and our AI automatically categorizes and suggests packing approaches.",
    },

    // Slide 6: Box & QR System
    {
      id: 6,
      type: "demo",
      title: "Box & QR Tracking",
      subtitle: "Never Lose an Item Again",
      content: (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Kitchen Box #3</h4>
                    <p className="text-sm text-muted-foreground">8 items • 12.5 kg</p>
                    <Badge className="mt-1 bg-warning/20 text-warning border-warning/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Fragile
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Coffee Maker", "Plates (set of 6)", "Wine Glasses", "Cutting Board"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border">
              <h4 className="text-xl font-semibold mb-4">How It Works</h4>
              <div className="space-y-4">
                {[
                  { step: 1, text: "AI suggests optimal box size based on items" },
                  { step: 2, text: "Create box and assign items" },
                  { step: 3, text: "Generate unique QR code" },
                  { step: 4, text: "Print label with handling instructions" },
                  { step: 5, text: "Scan to verify contents anytime" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      speakerNotes: "Each box gets a unique QR code. Movers scan to see contents, handling instructions, and fragility warnings. This dramatically reduces damage and lost items.",
    },

    // Slide 7: AI Packing Assistant
    {
      id: 7,
      type: "demo",
      title: "AI Packing Assistant",
      subtitle: "Smart Recommendations Powered by GPT",
      content: (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                category: "Fragile Items",
                icon: AlertTriangle,
                color: "text-warning",
                tips: ["Use bubble wrap generously", "Pack glasses rim-down", "Label all sides FRAGILE"],
              },
              {
                category: "Heavy Items",
                icon: Package,
                color: "text-primary",
                tips: ["Small boxes for books", "Distribute weight evenly", "Reinforce box bottoms"],
              },
              {
                category: "Essentials",
                icon: Star,
                color: "text-accent",
                tips: ["Pack last, unpack first", "Keep with you on moving day", "Include toiletries & meds"],
              },
            ].map((cat, i) => (
              <Card key={i} className="overflow-hidden">
                <div className={`h-2 ${i === 0 ? 'bg-warning' : i === 1 ? 'bg-primary' : 'bg-accent'}`} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                    <h4 className="font-semibold">{cat.category}</h4>
                  </div>
                  <ul className="space-y-2">
                    {cat.tips.map((tip, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-card border rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h4 className="font-semibold">AI-Generated Box Suggestions</h4>
            </div>
            <p className="text-muted-foreground text-sm">
              "Based on your 116 items, I recommend 12 medium boxes, 4 large boxes, and 2 wardrobe boxes. 
              Your kitchen items should be packed in 3 separate boxes to distribute weight properly. 
              Consider packing your electronics last as they'll need special handling."
            </p>
          </div>
        </div>
      ),
      speakerNotes: "Our AI analyzes your inventory and provides personalized packing strategies. It considers weight distribution, fragility, and optimal box utilization.",
    },

    // Slide 8: User Flow
    {
      id: 8,
      type: "flow",
      title: "Complete User Journey",
      subtitle: "From Signup to Settled",
      content: (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: Users, label: "Sign Up", desc: "Create account" },
              { icon: Package, label: "Inventory", desc: "Add items" },
              { icon: Box, label: "Pack", desc: "AI-guided" },
              { icon: Truck, label: "Book", desc: "Find movers" },
              { icon: MapPin, label: "Track", desc: "Live updates" },
            ].map((step, i) => (
              <div key={i} className="relative">
                <Card className="text-center p-4 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h5 className="font-semibold text-sm">{step.label}</h5>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </Card>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Detailed Flow</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  "Register and set moving date",
                  "Add items via photos or manual entry",
                  "AI categorizes and suggests organization",
                  "Create boxes with QR codes",
                  "Browse and compare movers",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  "Book and pay securely",
                  "Receive moving day reminders",
                  "Track mover in real-time",
                  "Confirm delivery & reconcile inventory",
                  "Rate and review experience",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">
                      {i + 6}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ),
      speakerNotes: "The user journey is designed to be intuitive. Each step naturally leads to the next, reducing cognitive load and decision fatigue.",
    },

    // Slide 9: Mover Marketplace
    {
      id: 9,
      type: "demo",
      title: "Moving Company Marketplace",
      subtitle: "Find, Compare, and Book Verified Movers",
      content: (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div className="space-y-4">
            {[
              { name: "Swift Movers Ltd", rating: 4.8, reviews: 234, price: "$450-600", verified: true },
              { name: "Island Transport Co", rating: 4.6, reviews: 189, price: "$380-520", verified: true },
              { name: "Express Relocations", rating: 4.5, reviews: 156, price: "$420-550", verified: false },
            ].map((mover, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold">{mover.name}</h5>
                        {mover.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        {mover.rating} ({mover.reviews} reviews)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">{mover.price}</span>
                    <p className="text-xs text-muted-foreground">estimated</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <h4 className="text-xl font-semibold">Marketplace Features</h4>
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Verified & insured companies" },
                { icon: Star, text: "Real customer reviews" },
                { icon: DollarSign, text: "Transparent pricing" },
                { icon: Clock, text: "Availability matching" },
                { icon: MessageSquare, text: "In-app communication" },
                { icon: CreditCard, text: "Secure payments with Stripe" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <feature.icon className="w-5 h-5 text-primary" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      speakerNotes: "The marketplace connects users with verified moving companies. All movers are rated and reviewed, ensuring quality and transparency.",
    },

    // Slide 10: Live Tracking
    {
      id: 10,
      type: "demo",
      title: "Real-Time Tracking",
      subtitle: "Know Where Your Belongings Are",
      content: (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in-up">
          <div className="bg-muted rounded-2xl p-6 relative overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent animate-pulse-dot" />
                <span className="font-semibold">Live Tracking</span>
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-xl p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Truck className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold">En Route</p>
                      <p className="text-sm text-muted-foreground">ETA: 25 minutes</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { time: "9:00 AM", event: "Pickup confirmed", done: true },
                    { time: "9:45 AM", event: "Loading complete", done: true },
                    { time: "10:15 AM", event: "In transit", done: true },
                    { time: "11:00 AM", event: "Arriving soon", done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${item.done ? 'bg-accent' : 'bg-muted-foreground'}`} />
                      <span className="text-muted-foreground w-16">{item.time}</span>
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-xl font-semibold">Tracking Features</h4>
            <ul className="space-y-4">
              {[
                "GPS location updates every 30 seconds",
                "Photo updates from moving crew",
                "Item-by-item delivery confirmation",
                "Push notifications for status changes",
                "Real-time chat with driver",
                "Issue reporting with photo evidence",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
      speakerNotes: "Real-time GPS tracking gives users peace of mind. They can see exactly where their belongings are at any moment during the move.",
    },

    // Slide 11: Technology Stack
    {
      id: 11,
      type: "tech",
      title: "Technology Stack",
      subtitle: "Built for Scale and Performance",
      content: (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Frontend
              </h4>
              <div className="space-y-3">
                {["React 18", "Vite", "TypeScript", "Tailwind CSS", "Shadcn UI", "React Query"].map((tech, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {tech}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                Backend
              </h4>
              <div className="space-y-3">
                {["Supabase", "PostgreSQL", "Edge Functions", "Real-time Subscriptions", "File Storage", "Row Level Security"].map((tech, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {tech}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Integrations
              </h4>
              <div className="space-y-3">
                {["Lovable AI (GPT/Gemini)", "Leaflet + OpenStreetMap", "Stripe Payments", "QR Code Libraries", "Push Notifications", "PWA Support"].map((tech, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    {tech}
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-warning/10 rounded-2xl p-6 border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Lock className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-semibold">Security First</h4>
                  <p className="text-sm text-muted-foreground">Row Level Security, encrypted data, secure auth</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Smartphone className="w-8 h-8 text-accent" />
                <div>
                  <h4 className="font-semibold">Mobile Ready</h4>
                  <p className="text-sm text-muted-foreground">PWA with offline support</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-warning" />
                <div>
                  <h4 className="font-semibold">Scalable</h4>
                  <p className="text-sm text-muted-foreground">Cloud-native architecture</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      speakerNotes: "Our tech stack is modern and battle-tested. React for the UI, Supabase for the backend, and best-in-class integrations for AI, maps, and payments.",
    },

    // Slide 12: Database Schema
    {
      id: 12,
      type: "tech",
      title: "Database Architecture",
      subtitle: "Relational Data Model & Security",
      content: (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img 
                src={schemaImage} 
                alt="EGZIT Database Schema" 
                className="w-full rounded-xl border shadow-card bg-card"
              />
            </div>
            <div className="space-y-6">
              <h4 className="text-xl font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Core Tables
              </h4>
              <div className="space-y-3">
                {[
                  { table: "profiles", desc: "User info synced from auth.users via trigger" },
                  { table: "inventories", desc: "Container for user's items, auto-created on signup" },
                  { table: "items", desc: "Individual belongings with room, category, QR codes" },
                  { table: "moves", desc: "Move requests with addresses, dates, status, tracking" },
                  { table: "movers", desc: "Moving company profiles with ratings & services" },
                  { table: "mover_services", desc: "Many-to-many: services offered by each mover" },
                  { table: "user_roles", desc: "Role-based access (admin/moderator/user)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-muted rounded-lg text-sm">
                    <code className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{item.table}</code>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span className="font-medium">Row Level Security</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Every table uses RLS policies - users can only access their own data. Admins use security definer functions.
              </span>
            </div>
          </Card>
        </div>
      ),
      speakerNotes: `DATABASE ARCHITECTURE DEEP DIVE:

**Core Tables Explained:**

1. **profiles** - Extends auth.users with display name/email. Created automatically via a database trigger (handle_new_user) when users sign up. The trigger also creates a default inventory.

2. **inventories** - Acts as a container for items. Each user gets one on signup. Items reference this via inventory_id.

3. **items** - The heart of the app. Stores name, category, room, fragile flag, weight, QR code, image_url, and packed status. References inventory_id (which item list it belongs to) and optionally box_id.

4. **moves** - Move requests with pickup_address, delivery_address, move_date, status tracking, assigned_mover_id, and GPS coordinates (current_lat/lng) for live tracking.

5. **movers** - Moving company profiles including name, description, rating, review_count, min_price, verified/insured flags, and availability.

6. **mover_services** - Junction table linking movers to their offered services (packing, storage, fragile handling, etc.).

7. **user_roles** - Stores role assignments (admin/moderator/user). Uses a security definer function has_role() to check permissions without causing recursive RLS issues.

**Security Implementation:**

- All tables have Row Level Security (RLS) enabled
- Users can only SELECT/INSERT/UPDATE/DELETE their own records (WHERE user_id = auth.uid())
- Admins bypass via the has_role() function with SECURITY DEFINER
- Movers table is publicly readable (for marketplace) but only admins can modify
- The has_role function prevents RLS recursion by using security definer

**Foreign Key Relationships:**

- items → inventories (via inventory_id)
- items → boxes (via box_id, optional)
- items → moves (via move_id, optional)
- moves → movers (via assigned_mover_id)
- moves → inventories (via inventory_id)
- mover_services → movers (via mover_id)
- user_roles → auth.users (via user_id)

**Triggers:**

- handle_new_user: Fires on auth.users INSERT, creates profile + default inventory

This architecture ensures data isolation, scalable relationships, and secure access patterns.`,
    },

    // Slide 13: Target Audience
    {
      id: 13,
      type: "feature",
      title: "Target Audience",
      subtitle: "Who Benefits from EGZIT",
      content: (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          {[
            {
              icon: Users,
              title: "Families",
              description: "Large households with complex inventory needs and multiple rooms to organize",
              benefits: ["Multi-room tracking", "Essential reminders", "Fragile handling"],
            },
            {
              icon: Heart,
              title: "Students",
              description: "Young adults moving for university or first apartments with limited budgets",
              benefits: ["Cost comparison", "Simple inventory", "Self-move option"],
            },
            {
              icon: Truck,
              title: "Moving Companies",
              description: "Professional movers seeking digital transformation and efficiency",
              benefits: ["QR scanning", "Route optimization", "Customer comms"],
            },
            {
              icon: FileText,
              title: "Property Managers",
              description: "Professionals managing multiple tenant relocations and turnovers",
              benefits: ["Bulk management", "Analytics", "Documentation"],
            },
          ].map((audience, i) => (
            <Card key={i} className="p-5 h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <audience.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">{audience.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{audience.description}</p>
              <div className="space-y-2">
                {audience.benefits.map((benefit, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ),
      speakerNotes: "EGZIT serves multiple user segments - from families managing large moves to students on tight budgets, and even moving companies seeking modernization.",
    },

    // Slide 14: Value Proposition
    {
      id: 14,
      type: "feature",
      title: "Why EGZIT Wins",
      subtitle: "Competitive Advantages",
      content: (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stat: "50%",
                label: "Less Time Spent Organizing",
                description: "AI automation reduces manual inventory work",
                icon: Clock,
              },
              {
                stat: "80%",
                label: "Fewer Lost Items",
                description: "QR tracking ensures accountability",
                icon: Shield,
              },
              {
                stat: "30%",
                label: "Cost Savings",
                description: "Efficient packing reduces box usage and damage",
                icon: DollarSign,
              },
            ].map((value, i) => (
              <Card key={i} className="p-6 text-center bg-gradient-to-br from-card to-muted/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-4xl font-bold text-gradient mb-2">{value.stat}</p>
                <h4 className="font-semibold mb-2">{value.label}</h4>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <h4 className="font-semibold mb-4">What Sets Us Apart</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "AI-powered recommendations (not just checklists)",
                "QR-based tracking throughout entire move",
                "Integrated mover marketplace with ratings",
                "Real-time GPS tracking and communication",
                "Essential item reminders based on move date",
                "Post-move analytics and feedback loop",
              ].map((diff, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <Zap className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-sm">{diff}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
      speakerNotes: "EGZIT delivers measurable value - 50% less organizing time, 80% fewer lost items, and 30% cost savings through efficient packing.",
    },

    // Slide 15: Pricing
    {
      id: 15,
      type: "feature",
      title: "Pricing Plans",
      subtitle: "Flexible Options for Every Move",
      content: (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "Perfect for small moves",
                features: ["Up to 50 items", "Basic QR tracking", "1 move per year", "Community support"],
                highlighted: false,
                cta: "Get Started",
              },
              {
                name: "Pro",
                price: "$9.99",
                period: "/month",
                description: "For frequent movers & families",
                features: ["Unlimited items", "AI packing assistant", "Unlimited moves", "Priority support", "Route optimization", "Box suggestions"],
                highlighted: true,
                cta: "Start Free Trial",
              },
              {
                name: "Business",
                price: "$49",
                period: "/month",
                description: "For moving companies",
                features: ["Everything in Pro", "Team management", "White-label options", "API access", "Analytics dashboard", "Dedicated support"],
                highlighted: false,
                cta: "Contact Sales",
              },
            ].map((plan, i) => (
              <Card key={i} className={`p-6 relative ${plan.highlighted ? 'border-primary shadow-elevated ring-2 ring-primary/20' : ''}`}>
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
                )}
                <div className="text-center mb-6">
                  <h4 className="font-semibold text-lg mb-1">{plan.name}</h4>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.highlighted ? '' : 'variant-outline'}`} variant={plan.highlighted ? 'default' : 'outline'}>
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            All plans include secure data storage, mobile app access, and regular updates.
          </p>
        </div>
      ),
      speakerNotes: "We offer flexible pricing: Free tier for casual users, Pro for families and frequent movers, and Business tier for moving companies.",
    },

    // Slide 16: Future Roadmap
    {
      id: 16,
      type: "feature",
      title: "Future Roadmap",
      subtitle: "What's Next for EGZIT",
      content: (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                phase: "Phase 1",
                title: "Enhanced AI",
                timeline: "Q1 2025",
                items: ["Image recognition for items", "Voice-controlled inventory", "Predictive damage prevention"],
              },
              {
                phase: "Phase 2",
                title: "Ecosystem Expansion",
                timeline: "Q2 2025",
                items: ["Storage facility integration", "Moving supply marketplace", "Insurance partnerships"],
              },
              {
                phase: "Phase 3",
                title: "Global Scale",
                timeline: "Q3 2025",
                items: ["Multi-language support", "International movers", "Corporate enterprise tier"],
              },
            ].map((phase, i) => (
              <Card key={i} className="overflow-hidden">
                <div className={`h-2 ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : 'bg-warning'}`} />
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-3">{phase.timeline}</Badge>
                  <h4 className="font-semibold mb-1">{phase.phase}</h4>
                  <p className="text-lg font-medium text-primary mb-4">{phase.title}</p>
                  <ul className="space-y-2">
                    {phase.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ),
      speakerNotes: "Our roadmap includes enhanced AI capabilities, ecosystem expansion with storage and supplies, and global scaling with enterprise features.",
    },

    // Slide 17: Closing
    {
      id: 17,
      type: "closing",
      title: "Thank You",
      subtitle: "Ready to Transform Moving?",
      content: (
        <div className="flex flex-col items-center gap-8 text-center animate-fade-in-up">
          <img src={egzitLogo} alt="EGZIT Logo" className="w-40 h-auto" />
          <div className="space-y-4 max-w-2xl">
            <p className="text-xl text-muted-foreground">
              AI-Powered Smart Moving Assistant
            </p>
            <p className="text-muted-foreground">
              Making every move smarter, faster, and stress-free.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4 flex-wrap justify-center">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge className="px-4 py-2 bg-accent/10 text-accent border-accent/20">
                <QrCode className="w-4 h-4 mr-2" />
                QR Tracking
              </Badge>
              <Badge className="px-4 py-2 bg-warning/10 text-warning border-warning/20">
                <Truck className="w-4 h-4 mr-2" />
                Smart Logistics
              </Badge>
            </div>
            <Button onClick={() => navigate("/")} className="mt-4">
              <Play className="w-4 h-4 mr-2" />
              Try EGZIT Now
            </Button>
          </div>
        </div>
      ),
      speakerNotes: "Thank you for your attention. EGZIT represents the future of moving - intelligent, trackable, and stress-free. Questions?",
    },
  ];

  // Update URL when slide changes
  useEffect(() => {
    setSearchParams({ slide: String(currentSlide + 1) }, { replace: true });
  }, [currentSlide, setSearchParams]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          toggleFullscreen();
        }
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1 && !isTransitioning) {
      setSlideDirection("next");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentSlide, slides.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0 && !isTransitioning) {
      setSlideDirection("prev");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentSlide, isTransitioning]);

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isTransitioning) {
      setSlideDirection(index > currentSlide ? "next" : "prev");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const copyShareLink = () => {
    const url = `${window.location.origin}/presentation?slide=${currentSlide + 1}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToPDF = () => {
    // Open print dialog with print-friendly styles
    window.print();
    toast.success("Print dialog opened - save as PDF");
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Header - hidden in fullscreen */}
      <header className={`border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 print:hidden transition-all duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : ''}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <PresentationIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold">EGZIT Presentation</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={copyShareLink} title="Share slide link">
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Share2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={exportToPDF} title="Export to PDF">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Toggle fullscreen (F)">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} / {slides.length}
              </span>
              <Progress value={((currentSlide + 1) / slides.length) * 100} className="w-24 h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen controls overlay */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity print:hidden">
          <Badge variant="secondary" className="text-xs">
            Press F or ESC to exit • ← → to navigate
          </Badge>
          <Button variant="secondary" size="icon" onClick={toggleFullscreen}>
            <Minimize className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main Content with slide transitions */}
      <main className={`flex-1 container mx-auto px-4 py-8 flex flex-col ${isFullscreen ? 'justify-center' : ''}`}>
        {/* Slide Content with transition animation */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-300 ease-out ${
            isTransitioning 
              ? slideDirection === "next" 
                ? "opacity-0 translate-x-8" 
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2 capitalize">{currentSlideData.type}</Badge>
            <h1 className={`font-bold mb-2 ${isFullscreen ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
              {currentSlideData.title}
            </h1>
            {currentSlideData.subtitle && (
              <p className={`text-muted-foreground ${isFullscreen ? 'text-xl' : 'text-lg'}`}>
                {currentSlideData.subtitle}
              </p>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className={`w-full ${isFullscreen ? 'max-w-6xl' : 'max-w-5xl'}`}>
              {currentSlideData.content}
            </div>
          </div>
        </div>

        {/* Quick Links - hidden in fullscreen */}
        <div className={`mt-8 flex justify-center gap-4 print:hidden transition-all duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : ''}`}>
          <Button variant="outline" size="sm" onClick={() => navigate("/video-demos")}>
            <Camera className="w-4 h-4 mr-2" />
            Screenshots
          </Button>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className={`border-t bg-card/80 backdrop-blur-sm sticky bottom-0 print:hidden transition-all duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : ''}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={currentSlide === 0 || isTransitioning}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Slide Indicators */}
            <div className="hidden md:flex gap-1 flex-wrap justify-center max-w-xl">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  title={`Slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Mobile slide counter */}
            <span className="md:hidden text-sm text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>

            <Button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1 || isTransitioning}
              className="gap-2"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Keyboard hints tooltip - shows briefly */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 print:hidden pointer-events-none">
        <Badge variant="secondary" className="opacity-50 text-xs">
          ← → Arrow keys to navigate • F for fullscreen
        </Badge>
      </div>
    </div>
  );
};

export default Presentation;
