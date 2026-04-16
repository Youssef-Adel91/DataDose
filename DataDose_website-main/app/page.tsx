import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import DashboardPreview from "./components/DashboardPreview";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-teal-200 relative overflow-hidden">
      <Navbar />
      
      {/* Background radial gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[800px] bg-gradient-to-b from-teal-100/50 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 w-full pt-16">
        <Hero />
        
        {/* Dashboard Preview centered below Hero */}
        <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8 mt-4 relative z-20 max-w-7xl mx-auto">
          <div className="w-full">
            <DashboardPreview />
          </div>
        </div>

        <div className="mt-24 mb-16 max-w-7xl mx-auto border-t border-slate-200 pt-16">
          <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-4">Features Section</h2>
          <p className="text-center text-slate-500 max-w-lg mx-auto mb-12">Futuristic professional, secure healthcare technology platform.</p>
          <Features />
        </div>
      </main>
      
      <footer className="text-center pb-8 pt-12 border-t border-slate-100 text-xs font-semibold text-slate-400">
         Copyright © Data Dose | Product · Company · Legal
      </footer>
    </div>
  );
}
