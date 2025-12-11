import React from 'react';
import { BrainCircuit, Video, Activity, Heart, Shield, Zap, Target } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group">
    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary border border-slate-100">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm border border-primary/30">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-primary">Project Overview</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Neuro-Rehab <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">Assistant</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Bridging the gap between clinical excellence and home recovery through advanced Multimodal AI.
          </p>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Our Mission
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-6">
            Recovery from neurological injuries like stroke or TBI is a 24/7 battle, but traditional therapy is limited to a few hours a week. Patients often struggle with form, motivation, and uncertainty at home.
          </p>
          <p className="text-slate-600 leading-relaxed text-lg">
            Our mission is to democratize access to elite-level coaching by building an AI companion that doesn't just "track" movement, but <strong>sees, understands, and guides</strong> the patient through every step of their journey.
          </p>
        </div>
        <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4 text-indigo-700">
            <Zap className="w-6 h-6" />
            <h3 className="font-bold text-lg">Powered By</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-2">Gemini 3.0</div>
          <p className="text-sm text-slate-600">
            Leveraging Google's latest multimodal models for real-time video processing, deep reasoning, and massive context windows.
          </p>
        </div>
      </div>

      {/* Core Technology Pillars */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-slate-800" />
          Core Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Video}
            title="Real-Time Multimodal Coaching"
            description="Unlike simple motion trackers, we use Gemini Live to process video and audio simultaneously. It identifies form deviations in real-time and provides instant voice corrections, just like a human therapist."
          />
          <FeatureCard 
            icon={Heart}
            title="Adaptive Personalization"
            description="Using Gemini's Reasoning engine, the app analyzes long-term patient history and pain logs to dynamically generate the optimal exercise plan for 'today', preventing burnout and re-injury."
          />
          <FeatureCard 
            icon={Shield}
            title="Clinical Safety & Reporting"
            description="We bridge the gap for clinicians by automating documentation. The AI summarizes sessions into clinical SOAP notes, highlighting red flags and progress trends for the medical team."
          />
        </div>
      </div>

      {/* Footer / Contact */}
      <div className="border-t border-slate-200 pt-8 mt-12 text-center">
        <p className="text-slate-500 text-sm">
          Built for the Google AI Hackathon 2025. 
          <span className="block mt-2">Designed with ❤️ for patients everywhere.</span>
        </p>
      </div>
    </div>
  );
};

export default About;
