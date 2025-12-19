import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import "./index.css";

function Root() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash for first-time visitors
    const hasSeenSplash = sessionStorage.getItem('egzit-splash-seen');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('egzit-splash-seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
