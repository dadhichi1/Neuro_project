import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, BrainCircuit, Zap } from 'lucide-react';
import { generateDailyPlan } from '../services/geminiService';
import { MOCK_HISTORY, INITIAL_PLAN } from '../constants';
import { DailyPlan, Exercise } from '../types';

const PlanGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<DailyPlan>(INITIAL_PLAN);
  const [currentPain, setCurrentPain] = useState(3);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const jsonStr = await generateDailyPlan(MOCK_HISTORY, currentPain);
      const parsed = JSON.parse(jsonStr);
      
      const newPlan: DailyPlan = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        focus: parsed.focus,
        rationale: parsed.rationale,
        exercises: parsed.exercises.map((e: any, idx: number) => ({
          id: `gen-${idx}`,
          name: e.name,
          description: e.description,
          targetReps: e.reps,
          targetSets: e.sets,
          difficulty: e.difficulty,
          focusArea: "Adaptive"
        }))
      };
      
      setCurrentPlan(newPlan);
    } catch (e) {
      setError("Failed to generate plan. Please check API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <BrainCircuit className="text-primary w-6 h-6" />
          Adaptive Plan Generator
        </h2>
        
        <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600 mb-3 font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Pre-Session Biometrics
          </p>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <span className="text-slate-500 text-sm font-medium">Current Pain Level:</span>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-bold text-slate-400">0</span>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={currentPain} 
                onChange={(e) => setCurrentPain(parseInt(e.target.value))}
                className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className={`font-bold w-8 text-center rounded px-1 ${currentPain > 6 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                {currentPain}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all transform active:scale-95
            ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-sky-600 hover:shadow-lg hover:shadow-primary/20'}`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin w-5 h-5" />
              Reasoning & Adapting Plan...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Generate Today's Optimal Plan
            </>
          )}
        </button>
        {error && <p className="text-rose-500 text-sm mt-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}
      </div>

      {/* Plan Display */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Today's Focus</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800">{currentPlan.focus}</h3>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wide">
              {currentPlan.status}
            </span>
          </div>
          
          <div className="mt-5 p-4 bg-primary/5 rounded-xl border border-primary/10 relative">
            <div className="absolute -left-1 top-4 w-1 h-8 bg-primary rounded-r"></div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" /> AI Clinical Rationale
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">"{currentPlan.rationale}"</p>
          </div>
        </div>

        {/* Exercises List */}
        <div className="divide-y divide-slate-100">
          {currentPlan.exercises.map((ex, idx) => (
            <div key={ex.id} className="p-5 hover:bg-slate-50 transition-all flex flex-col md:flex-row gap-4 md:items-center group">
              
              {/* Number Badge */}
              <div className="flex-shrink-0">
                 <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:border-primary group-hover:text-primary transition-colors">
                   {idx + 1}
                 </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                  <h4 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{ex.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${
                       ex.difficulty === 'High' ? 'bg-rose-100 text-rose-600' : 
                       ex.difficulty === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>{ex.difficulty} Intensity</span>
                </div>
                
                <p className="text-slate-600 text-sm mb-3">{ex.description}</p>
                
                {/* Contextual "Why" Badge - New Feature */}
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-100">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Helps with: <strong>{getFunctionalGoal(ex.name)}</strong></span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-row md:flex-col gap-3 md:gap-1 text-right md:min-w-[100px] border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                <div className="flex-1 md:flex-none">
                  <span className="block text-xs text-slate-400 uppercase">Reps</span>
                  <span className="font-bold text-slate-700 text-lg">{ex.targetReps}</span>
                </div>
                <div className="flex-1 md:flex-none">
                   <span className="block text-xs text-slate-400 uppercase">Sets</span>
                   <span className="font-bold text-slate-700 text-lg">{ex.targetSets}</span>
                </div>
              </div>

              <button className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all p-3 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-full">
                <CheckCircle className="w-8 h-8" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper to simulate "Reasoning" about functional goals
const getFunctionalGoal = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('rotation')) return "Checking blind spots driving";
  if (n.includes('reach')) return "Grabbing items from shelves";
  if (n.includes('stand')) return "Getting out of a car/chair";
  if (n.includes('step')) return "Climbing stairs safely";
  return "Daily movement stability";
};

export default PlanGenerator;