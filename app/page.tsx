import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustStrip from "./components/TrustStrip";
import KnowledgeGraph from "./components/KnowledgeGraph";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import PolypharmacyScan from "./components/PolypharmacyScan";
import SmartAlternatives from "./components/SmartAlternatives";
import SymptomDetector from "./components/SymptomDetector";
import VisualPrescriptionMap from "./components/VisualPrescriptionMap";
import GraphRAGChatbot from "./components/GraphRAGChatbot";
import InteractiveDemo from "./components/InteractiveDemo";
import Workflows from "./components/Workflows";
import DashboardPreview from "./components/DashboardPreview";
import Analytics from "./components/Analytics";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="home-background relative font-sans text-slate-900 selection:bg-teal-200">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <KnowledgeGraph />
        <Features />
        <HowItWorks />

        {/* Feature 1: N-Degree Polypharmacy Scanner */}
        <section className="py-16 section-gradient-1">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-teal-600 text-xs font-bold tracking-widest uppercase mb-2">Feature 1</span>
              <h2 className="text-3xl font-extrabold text-slate-900">N-Degree Polypharmacy Scanner</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">Try it now — enter your medications and run a live Knowledge Graph scan.</p>
            </div>
            <PolypharmacyScan />
          </div>
        </section>

        {/* Feature 2: Smart Alternatives */}
        <section className="py-16 section-gradient-2">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-2">Feature 2</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Smart Safe Alternatives Engine</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">Replace a dangerous drug by specifying what you need to treat and what side effect to avoid.</p>
            </div>
            <SmartAlternatives />
          </div>
        </section>

        {/* Feature 3: Reverse Symptom Tracer */}
        <section className="py-16 section-gradient-1">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-2">Feature 3</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Reverse Symptom Tracer</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">Enter an unexpected symptom to trace back the culprit drug and its mechanism.</p>
            </div>
            <SymptomDetector />
          </div>
        </section>

        {/* Feature 4: Visual Prescription Map */}
        <section className="py-16 section-gradient-2">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-cyan-600 text-xs font-bold tracking-widest uppercase mb-2">Feature 4</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Prescription Visual Map</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">An interactive graph showing your full prescription with color-coded interaction edges.</p>
            </div>
            <VisualPrescriptionMap />
          </div>
        </section>

        {/* Feature 5: GraphRAG Chatbot */}
        <section className="py-16 section-gradient-1">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-slate-600 text-xs font-bold tracking-widest uppercase mb-2">Feature 5</span>
              <h2 className="text-3xl font-extrabold text-slate-900">GraphRAG AI Chatbot</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">Ask clinical questions. Every answer is grounded in the Knowledge Graph, not hallucinated.</p>
            </div>
            <GraphRAGChatbot />
          </div>
        </section>

        <InteractiveDemo />
        <Workflows />
        <DashboardPreview />
        <Analytics />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
