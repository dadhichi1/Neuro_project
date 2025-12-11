import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Video, Calendar, FileText, Activity, MessageCircleQuestion, Info } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LiveSession from './components/LiveSession';
import PlanGenerator from './components/PlanGenerator';
import ClinicianReport from './components/ClinicianReport';
import PatientChat from './components/PatientChat';
import About from './components/About';

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-primary text-white shadow-md shadow-primary/30' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const MobileNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-colors ${
        isActive 
          ? 'text-primary font-semibold' 
          : 'text-slate-400'
      }`}
    >
      <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
      <span className="text-[10px]">{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
        
        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">NeuroRehab</span>
          </div>
          
          <nav className="space-y-2 flex-1">
            <SidebarItem to="/" icon={LayoutDashboard} label="Overview" />
            <SidebarItem to="/live" icon={Video} label="Live Session" />
            <SidebarItem to="/plan" icon={Calendar} label="Adaptive Plan" />
            <SidebarItem to="/chat" icon={MessageCircleQuestion} label="Q&A Assistant" />
            <SidebarItem to="/reports" icon={FileText} label="Clinician Reports" />
            <SidebarItem to="/about" icon={Info} label="About Project" />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                AM
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Alex Mercer</p>
                <p className="text-xs text-slate-500">Patient</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- MOBILE HEADER (Top Bar) --- */}
        <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">NeuroRehab</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
            AM
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-auto relative">
          <div className="h-full w-full p-4 md:p-8 pb-24 md:pb-8 max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live" element={<div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] rounded-2xl overflow-hidden"><LiveSession /></div>} />
              <Route path="/plan" element={<PlanGenerator />} />
              <Route path="/chat" element={<div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]"><PatientChat /></div>} />
              <Route path="/reports" element={<ClinicianReport />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between items-center pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <MobileNavItem to="/" icon={LayoutDashboard} label="Home" />
           <MobileNavItem to="/live" icon={Video} label="Live" />
           <MobileNavItem to="/plan" icon={Calendar} label="Plan" />
           <MobileNavItem to="/chat" icon={MessageCircleQuestion} label="Chat" />
           <MobileNavItem to="/about" icon={Info} label="About" />
        </div>

      </div>
    </Router>
  );
};

export default App;