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
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 relative overflow-x-hidden">
      {/* Decorative Blur Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-teal/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-brand-teal/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 w-full">
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
