import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustStrip from "./components/TrustStrip";
import KnowledgeGraph from "./components/KnowledgeGraph";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Workflows from "./components/Workflows";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <main className="relative z-10 w-full pt-4">
        {/* 1. Clinical System Entry */}
        <Hero />

        {/* 2. System Capabilities */}
        <TrustStrip />

        {/* 3. Knowledge Graph Visualization */}
        <KnowledgeGraph />

        {/* 4. Core Features Grid */}
        <Features />

        {/* 5. How the System Works */}
        <div id="system-workflow">
          <HowItWorks />
        </div>

        {/* 6. Role-Based Workflows */}
        <Workflows />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
