import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SplashScreen, { checkSplashShown } from "./components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Inventory from "./pages/Inventory";
import ItemDetail from "./pages/ItemDetail";
import Boxes from "./pages/Boxes";
import Packing from "./pages/Packing";
import Movers from "./pages/Movers";
import MoverDetail from "./pages/MoverDetail";
import RequestMove from "./pages/RequestMove";
import MyMoves from "./pages/MyMoves";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import RoutePage from "./pages/Route";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Chat from "./pages/Chat";
import Track from "./pages/Track";
import MovingTimeline from "./pages/MovingTimeline";
import Essentials from "./pages/Essentials";
import MovingDayChecklist from "./pages/MovingDayChecklist";
import AddressChanges from "./pages/AddressChanges";
import MoveHistory from "./pages/MoveHistory";
import Presentation from "./pages/Presentation";
import SpeakerNotes from "./pages/SpeakerNotes";
import VideoDemos from "./pages/VideoDemos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => !checkSplashShown());

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/inventory/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
              <Route path="/boxes" element={<ProtectedRoute><Boxes /></ProtectedRoute>} />
              <Route path="/packing" element={<ProtectedRoute><Packing /></ProtectedRoute>} />
              <Route path="/movers" element={<ProtectedRoute><Movers /></ProtectedRoute>} />
              <Route path="/movers/:id" element={<ProtectedRoute><MoverDetail /></ProtectedRoute>} />
              <Route path="/request-move" element={<ProtectedRoute><RequestMove /></ProtectedRoute>} />
              <Route path="/my-moves" element={<ProtectedRoute><MyMoves /></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/payment-cancelled" element={<ProtectedRoute><PaymentCancelled /></ProtectedRoute>} />
              <Route path="/route" element={<ProtectedRoute><RoutePage /></ProtectedRoute>} />
              <Route path="/timeline" element={<ProtectedRoute><MovingTimeline /></ProtectedRoute>} />
              <Route path="/essentials" element={<ProtectedRoute><Essentials /></ProtectedRoute>} />
              <Route path="/moving-day-checklist" element={<ProtectedRoute><MovingDayChecklist /></ProtectedRoute>} />
              <Route path="/address-changes" element={<ProtectedRoute><AddressChanges /></ProtectedRoute>} />
              <Route path="/move-history" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/chat/:moverId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/track/:moveId" element={<ProtectedRoute><Track /></ProtectedRoute>} />
              <Route path="/presentation" element={<Presentation />} />
              <Route path="/speaker-notes" element={<SpeakerNotes />} />
              <Route path="/video-demos" element={<VideoDemos />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
