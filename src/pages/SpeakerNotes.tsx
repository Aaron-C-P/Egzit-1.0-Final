import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Save, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface SlideNote {
  id: number;
  title: string;
  notes: string;
}

const defaultNotes: SlideNote[] = [
  { id: 1, title: "Title Slide", notes: "Welcome to EGZIT - a comprehensive moving assistant that uses AI to revolutionize the relocation experience." },
  { id: 2, title: "The Moving Problem", notes: "Moving is stressful. 30% forget essentials, 45% struggle with organization. These statistics highlight the need for a smarter solution." },
  { id: 3, title: "Introducing EGZIT", notes: "EGZIT solves these problems with three core pillars: AI intelligence, QR-based tracking, and smart logistics management." },
  { id: 4, title: "Core Features", notes: "These 12 core features work together to provide a complete moving ecosystem - from initial inventory to final delivery confirmation." },
  { id: 5, title: "Smart Inventory System", notes: "The inventory system is the heart of EGZIT. Users can add items via photos, and our AI automatically categorizes and suggests packing approaches." },
  { id: 6, title: "Box & QR Tracking", notes: "Each box gets a unique QR code. Movers scan to see contents, handling instructions, and fragility warnings. This dramatically reduces damage and lost items." },
  { id: 7, title: "AI Packing Assistant", notes: "Our AI analyzes your inventory and provides personalized packing strategies. It considers weight distribution, fragility, and optimal box utilization." },
  { id: 8, title: "Complete User Journey", notes: "The user journey is designed to be intuitive. Each step naturally leads to the next, reducing cognitive load and decision fatigue." },
  { id: 9, title: "Moving Company Marketplace", notes: "The marketplace connects users with verified moving companies. All movers are rated and reviewed, ensuring quality and transparency." },
  { id: 10, title: "Real-Time Tracking", notes: "Real-time GPS tracking gives users peace of mind. They can see exactly where their belongings are at any moment during the move." },
  { id: 11, title: "Technology Stack", notes: "Our tech stack is modern and battle-tested. React for the UI, Supabase for the backend, and best-in-class integrations for AI, maps, and payments." },
  { id: 12, title: "Database Architecture", notes: "DATABASE ARCHITECTURE: Core tables include profiles (user info via trigger), inventories (container for items), items (belongings with QR codes), moves (requests with addresses/status), movers (company profiles), mover_services (many-to-many services), and user_roles (admin/moderator/user). All tables use Row Level Security. The has_role() function uses SECURITY DEFINER to prevent RLS recursion. Foreign keys link items→inventories→moves→movers." },
  { id: 13, title: "Target Audience", notes: "EGZIT serves multiple user segments - from families managing large moves to students on tight budgets, and even moving companies seeking modernization." },
  { id: 14, title: "Why EGZIT Wins", notes: "EGZIT delivers measurable value - 50% less organizing time, 80% fewer lost items, and 30% cost savings through efficient packing." },
  { id: 15, title: "Pricing Plans", notes: "We offer flexible pricing: Free tier for casual users, Pro for families and frequent movers, and Business tier for moving companies." },
  { id: 16, title: "Future Roadmap", notes: "Our roadmap includes enhanced AI capabilities, ecosystem expansion with storage and supplies, and global scaling with enterprise features." },
  { id: 17, title: "Closing", notes: "Thank you for your attention. EGZIT represents the future of moving - intelligent, trackable, and stress-free. Questions?" },
];

const SpeakerNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<SlideNote[]>(() => {
    const saved = localStorage.getItem("egzit-speaker-notes");
    return saved ? JSON.parse(saved) : defaultNotes;
  });

  useEffect(() => {
    localStorage.setItem("egzit-speaker-notes", JSON.stringify(notes));
  }, [notes]);

  const updateNote = (id: number, newNotes: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, notes: newNotes } : note
    ));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const content = notes.map(n => `Slide ${n.id}: ${n.title}\n${n.notes || "(No notes)"}\n`).join("\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "egzit-speaker-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/presentation")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Speaker Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-6">
          Add your speaker notes for each slide. Notes are saved automatically to your browser.
        </p>
        
        <div className="grid gap-4">
          {notes.map((slide) => (
            <Card key={slide.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {slide.id}
                  </span>
                  {slide.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your speaker notes for this slide..."
                  value={slide.notes}
                  onChange={(e) => updateNote(slide.id, e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <style>{`
        @media print {
          header, button { display: none !important; }
          .container { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default SpeakerNotes;
