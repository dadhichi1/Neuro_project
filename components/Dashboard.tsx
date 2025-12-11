import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_HISTORY, MOCK_PROFILE, RECOVERY_JOURNEY } from '../constants';
import { Trophy, Star, Target, ArrowRight, Lock, CheckCircle, Flame, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const currentStage = RECOVERY_JOURNEY.find(s => s.status === 'current') || RECOVERY_JOURNEY[0];
  const nextStage = RECOVERY_JOURNEY.find(s => s.level === currentStage.level + 1);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      
      {/* 1. HERO: Current Level & Motivation */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-1000"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-white/10 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                Phase {currentStage.level} Active
              </span>
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{MOCK_PROFILE.streak} Day Streak</span>
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">{currentStage.name}</h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">{currentStage.description}</p>
            </div>
            
            <div className="space-y-2 pt-2 max-w-lg">
              <div className="flex justify-between text-xs md:text-sm font-semibold tracking-wide uppercase text-slate-400">
                <span>Level Progress</span>
                <span className="text-white">{currentStage.progress}%</span>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-primary transition-all duration-1000 ease-out relative"
                  style={{ width: `${currentStage.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" /> 
                Next Reward: <span className="text-white">Unlocks Strength Training</span>
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex flex-col justify-center h-full hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                 <Target className="w-4 h-4" />
              </div>
              <h3 className="font-bold uppercase text-xs tracking-widest">Motivation</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Completing this level is the key to:
            </p>
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 flex items-center gap-4 border border-emerald-500/30">
              <div className="p-3 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base leading-tight">{currentStage.unlocks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. JOURNEY MAP */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recovery Roadmap
        </h3>
        <div className="overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0">
          <div className="flex items-center min-w-max relative">
            {/* Connecting Line Background */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-slate-100 -z-10 mx-10"></div>
            
            {RECOVERY_JOURNEY.map((stage, idx) => {
              return (
                <div key={stage.level} className="flex-1 min-w-[140px] md:min-w-[180px] flex flex-col items-center group cursor-pointer">
                  <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-4 z-10 transition-all duration-300 shadow-sm
                    ${stage.status === 'completed' ? 'bg-emerald-500 border-emerald-100 text-white' : 
                      stage.status === 'current' ? 'bg-white border-primary text-primary shadow-xl shadow-primary/20 scale-110 rotate-3' : 
                      'bg-slate-50 border-slate-200 text-slate-300'}
                  `}>
                    {stage.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : 
                     stage.status === 'current' ? <span className="font-black text-xl">{stage.level}</span> : 
                     <Lock className="w-5 h-5" />}
                  </div>
                  
                  <div className="mt-4 text-center px-2">
                    <p className={`text-xs md:text-sm font-bold transition-colors ${stage.status === 'current' ? 'text-slate-800 scale-105' : 'text-slate-500'}`}>
                      {stage.name}
                    </p>
                    {stage.status === 'current' && (
                       <span className="text-[10px] uppercase font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full mt-2 inline-block">Current</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. CHARTS & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Stability & Pain Trends</h3>
              <p className="text-xs text-slate-400 mt-1">Consistency is improving week over week</p>
            </div>
            <select className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
              <option>Last 7 Sessions</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_HISTORY}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: 600}}
                />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorComp)" 
                  name="Success Rate %" 
                />
                <Area 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="painLevelEnd" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPain)" 
                  name="Pain Level" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Daily Goal Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24 text-indigo-500" />
            </div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Today's Target</h3>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-black text-slate-800">85%</span>
                 <span className="text-sm text-slate-500 font-medium mb-1.5">Accuracy</span>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 w-[60%] h-full rounded-full shadow-lg shadow-indigo-500/30"></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-400">
                   <span>Current: 60%</span>
                   <span>Goal: 85%</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3 items-center">
                 <div className="bg-white p-1.5 rounded-lg shadow-sm">
                   <Activity className="w-4 h-4 text-indigo-600" />
                 </div>
                 <p className="text-xs text-indigo-800 font-medium leading-tight">Complete today's adaptive plan to hit your target.</p>
              </div>
            </div>
          </div>

          {/* Badge Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4">
             <div className="p-4 bg-white rounded-full shadow-md shadow-orange-100 text-amber-500">
               <Trophy className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-bold text-amber-900 text-sm">Consistent King</h4>
               <p className="text-xs text-amber-700/80 mt-1 leading-snug">Completed 10 sessions in a row without skipping.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;