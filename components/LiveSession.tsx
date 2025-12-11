import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Play, AlertCircle, PauseCircle, Activity, Heart, Move, CheckCircle, Trophy, Star, Layers, Zap, RotateCcw, Crosshair, User } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob, FunctionDeclaration, Type } from '@google/genai';
import { MOCK_PROFILE, MOCK_HISTORY } from '../constants';

// Live API Helpers
function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// --- MOTION ANALYSIS ALGORITHM ---
// Calculates Center of Motion (COM) and Motion Energy from pixel differences
const calculateMotionMetrics = (
  current: Uint8ClampedArray, 
  prev: Uint8ClampedArray, 
  width: number, 
  height: number
) => {
  let diffScore = 0;
  let centerOfMotionX = 0;
  let activePixels = 0;

  // Stride loop for performance (check every 4th pixel)
  // i represents the index in the flattened RGBA array
  for (let i = 0; i < current.length; i += 4 * 4) { 
    const rDiff = Math.abs(current[i] - prev[i]);
    const gDiff = Math.abs(current[i + 1] - prev[i + 1]);
    const bDiff = Math.abs(current[i + 2] - prev[i + 2]);
    
    // Pixel Difference Threshold
    if (rDiff + gDiff + bDiff > 40) { 
       diffScore += (rDiff + gDiff + bDiff);
       
       // Calculate X coordinate of this pixel
       // i / 4 gives the pixel index (0 to width*height-1)
       // pixelIndex % width gives the x coordinate
       const pixelIdx = i / 4;
       const x = pixelIdx % width;
       centerOfMotionX += x;
       activePixels++;
    }
  }

  // Calculate normalized centroid X (-1 to 1, where 0 is center)
  const avgX = activePixels > 0 ? centerOfMotionX / activePixels : width / 2;
  const normalizedX = (avgX / width) * 2 - 1; 

  return { 
    score: Math.min(100, diffScore / (width * height) * 10), // Normalized 0-100 score
    centroidX: activePixels > 20 ? normalizedX : 0 // Lower threshold for responsiveness
  };
};

// Tool Definitions
const emergencyStopTool: FunctionDeclaration = {
  name: "emergencyStop",
  description: "Immediately pause the session if the user reports severe pain, requests to stop, or if you detect unsafe movement patterns.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: { type: Type.STRING, description: "The reason for stopping, e.g., 'User reported pain', 'Unsafe form'." }
    },
    required: ["reason"]
  }
};

const logPainTool: FunctionDeclaration = {
  name: "logPain",
  description: "Log a specific pain level reported by the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      level: { type: Type.NUMBER, description: "Pain level from 0 to 10." },
      location: { type: Type.STRING, description: "Body part where pain is felt." }
    },
    required: ["level"]
  }
};

// --- COMPONENTS ---

// 1. Rhythm Flow Guide (New Animation)
const RhythmGuide = ({ active }: { active: boolean }) => (
  <div className={`absolute inset-x-0 bottom-32 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}>
     <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 mb-4">
       <p className="text-white font-bold tracking-widest text-sm uppercase flex items-center gap-2">
         <Move className="w-4 h-4 text-sky-400" /> Match the Tempo
       </p>
     </div>
     
     {/* The Track */}
     <div className="relative w-[80%] max-w-lg h-4 bg-slate-700/50 rounded-full overflow-visible">
        {/* Center Marker */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/30"></div>
        
        {/* The Moving Orb */}
        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-sky-400 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.8)] border-2 border-white animate-[oscillate_4s_ease-in-out_infinite]"></div>
        
        {/* Ghost Trail (Visual Flair) */}
        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-sky-400/30 rounded-full animate-[oscillate_4s_ease-in-out_infinite] delay-75 blur-sm"></div>
     </div>
     
     <div className="flex justify-between w-[80%] max-w-lg mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
       <span>Left Twist</span>
       <span>Center</span>
       <span>Right Twist</span>
     </div>
     
     <style>{`
       @keyframes oscillate {
         0%, 100% { left: 0%; transform: translate(0, -50%); }
         50% { left: 100%; transform: translate(-100%, -50%); }
       }
     `}</style>
  </div>
);

// 2. Stick Figure Guide (Target Form Animation) - LEFT
const StickFigureGuide = () => (
  <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 z-30 w-36 h-36 md:w-44 md:h-44 flex flex-col items-center justify-center pointer-events-none shadow-2xl">
     <div className="flex items-center gap-1.5 mb-2 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
        <Crosshair className="w-3 h-3 text-emerald-400" />
        <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest">Target Goal</p>
     </div>
     <div className="flex-1 w-full relative">
       <svg viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-[3px] fill-none stroke-linecap-round stroke-linejoin-round overflow-visible">
          {/* Chair Base */}
          <path d="M35,85 L35,65 L65,65 L65,85" className="stroke-slate-500 stroke-[2px]" />
          <path d="M35,65 L65,65" className="stroke-slate-600 stroke-[2px]" />

          {/* Legs (Static) */}
          <path d="M42,65 L42,85 M58,65 L58,85" className="stroke-slate-400" />

          {/* Upper Body Group (Animated) */}
          <g className="animate-[torsoTwist_4s_ease-in-out_infinite] origin-[50%_65%]">
             {/* Hips */}
             <path d="M42,65 L58,65" className="stroke-sky-400" />
             {/* Torso */}
             <line x1="50" y1="65" x2="50" y2="35" className="stroke-sky-400 stroke-[4px]" />
             {/* Head */}
             <circle cx="50" cy="25" r="7" className="stroke-sky-400 fill-sky-900/50" />
             {/* Arms (Outstretched) */}
             <path d="M25,45 L75,45" className="stroke-white stroke-[3px]" />
             {/* Hands */}
             <circle cx="25" cy="45" r="2" className="fill-white stroke-none" />
             <circle cx="75" cy="45" r="2" className="fill-white stroke-none" />
          </g>
       </svg>
     </div>
     <style>{`
       @keyframes torsoTwist {
         0%, 100% { transform: rotate(0deg); }
         25% { transform: rotate(-20deg); }
         50% { transform: rotate(0deg); }
         75% { transform: rotate(20deg); }
       }
     `}</style>
  </div>
);

// 3. User Skeleton (Digital Mirror) - RIGHT
// Updated to accept real-time calculated lean angle
const UserSkeleton = ({ leanAngle }: { leanAngle: number }) => (
  <div className="absolute top-20 right-4 bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 z-30 w-36 h-36 md:w-44 md:h-44 flex flex-col items-center justify-center pointer-events-none shadow-2xl">
     <div className="flex items-center gap-1.5 mb-2 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
        <User className="w-3 h-3 text-indigo-400" />
        <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest">Your Form</p>
     </div>
     <div className="flex-1 w-full relative">
       <svg viewBox="0 0 100 100" className="w-full h-full stroke-white stroke-[3px] fill-none stroke-linecap-round stroke-linejoin-round overflow-visible">
          {/* Chair Base (Faded) */}
          <path d="M35,85 L35,65 L65,65 L65,85" className="stroke-slate-600/50 stroke-[2px]" />
          <path d="M35,65 L65,65" className="stroke-slate-700/50 stroke-[2px]" />

          {/* Legs */}
          <path d="M42,65 L42,85 M58,65 L58,85" className="stroke-slate-500" />

          {/* User Body (Real-time calculated animation) */}
          <g 
            style={{ 
              transform: `rotate(${leanAngle}deg)`, 
              transformOrigin: '50% 65%', 
              transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
             {/* Hips */}
             <path d="M42,65 L58,65" className="stroke-indigo-400" />
             {/* Torso */}
             <line x1="50" y1="65" x2="50" y2="35" className="stroke-indigo-400 stroke-[4px]" />
             {/* Head */}
             <circle cx="50" cy="25" r="7" className="stroke-indigo-400 fill-indigo-900/50" />
             {/* Arms */}
             <path d="M25,45 L75,45" className="stroke-white stroke-[3px]" />
             {/* Hands */}
             <circle cx="25" cy="45" r="2" className="fill-white" />
             <circle cx="75" cy="45" r="2" className="fill-white" />
          </g>
       </svg>
     </div>
  </div>
);

// 4. Central Scoreboard - TOP CENTER
const Scoreboard = ({ score, reps }: { score: number, reps: number }) => {
  const getScoreColor = (s: number) => {
    if (s > 80) return 'text-emerald-400';
    if (s > 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-30 pointer-events-none">
       {/* Quality Score */}
       <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[90px] md:min-w-[110px] shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Quality</span>
          <span className={`text-3xl font-black tracking-tighter ${getScoreColor(score)}`}>{score}%</span>
       </div>
       
       {/* Rep Counter */}
       <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[90px] md:min-w-[110px] shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Reps</span>
          <span className="text-3xl font-black text-white tracking-tighter">{reps}</span>
       </div>
    </div>
  );
};

const PostSessionSummary = ({ metrics, onDismiss }: { metrics: { stability: number, rom: number }, onDismiss: () => void }) => (
  <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
    <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-amber-500"></div>
      
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Trophy className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-slate-400 text-sm">You crushed your stability goals today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Avg Stability</p>
          <p className="text-2xl font-bold text-emerald-400">{Math.round(metrics.stability)}%</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Motion Score</p>
          <p className="text-2xl font-bold text-primary">{Math.round(metrics.rom)}%</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 rounded-xl border border-amber-500/20 mb-8 flex items-center gap-4">
        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
        <div>
          <p className="text-amber-200 font-bold text-lg">+120 XP</p>
          <p className="text-amber-400/70 text-xs">Level 3 Progress: 88%</p>
        </div>
      </div>

      <button 
        onClick={onDismiss}
        className="w-full py-4 bg-primary hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
      >
        <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
        Return to Dashboard
      </button>
    </div>
  </div>
);

const LiveSession: React.FC = () => {
  // Session State
  const [status, setStatus] = useState<'idle' | 'preparing' | 'countdown' | 'connecting' | 'connected' | 'paused' | 'error' | 'summary'>('idle');
  const [active, setActive] = useState(false);
  const shouldProcessFrames = useRef(false);
  
  // Controls
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [countdown, setCountdown] = useState(3);
  
  // Feedback
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [aiCaption, setAiCaption] = useState('');
  const [metrics, setMetrics] = useState({ stability: 95, rom: 0, velocity: 45 });
  const [visualCue, setVisualCue] = useState<{ icon: any, text: string, color: string } | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [matchScore, setMatchScore] = useState(85); 
  const [userLean, setUserLean] = useState(0); // Real-time angle calculated from video

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null); // Dedicated small canvas for CV
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captionTimeoutRef = useRef<number | null>(null);
  
  // Analysis Refs
  const analysisLoopRef = useRef<number>();
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const repStateRef = useRef<'center' | 'left' | 'right'>('center');
  const lastGeminiSendTimeRef = useRef<number>(0);

  // Keyword detection for Visual Cues (From AI Speech)
  useEffect(() => {
    const lowerText = aiCaption.toLowerCase();
    if (lowerText.includes("straight") || lowerText.includes("posture")) {
      setVisualCue({ icon: Move, text: "Correcting Posture", color: "text-amber-400" });
    } else if (lowerText.includes("slow") || lowerText.includes("fast")) {
      setVisualCue({ icon: Activity, text: "Adjusting Tempo", color: "text-blue-400" });
    } else if (lowerText.includes("good") || lowerText.includes("great") || lowerText.includes("perfect")) {
      setVisualCue({ icon: CheckCircle, text: "Great Form", color: "text-emerald-400" });
    } else if (lowerText.includes("pain") || lowerText.includes("hurt")) {
      setVisualCue({ icon: Heart, text: "Pain Monitoring", color: "text-rose-400" });
    }

    if (visualCue) {
      const timer = setTimeout(() => setVisualCue(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [aiCaption]);

  // Step 1: Initialize Camera & Show Preview (Preparation Phase)
  const prepareSession = async () => {
    try {
      setStatus('preparing');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // Step 2: Start Countdown
  const startCountdown = () => {
    setStatus('countdown');
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          connectGemini(); // Step 3: Auto-connect after countdown
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 3: Connect to Gemini & Start Analysis Loop
  const connectGemini = async () => {
    try {
      setStatus('connecting');
      setAlertMessage(null);
      setAiCaption('');
      setRepCount(0);
      setMatchScore(80);
      setUserLean(0);
      
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Initialize small analysis canvas
      if (!analysisCanvasRef.current) {
        const c = document.createElement('canvas');
        c.width = 64; // Low res for fast processing
        c.height = 48;
        analysisCanvasRef.current = c;
      }

      // --- CONTEXT INJECTION ---
      const patientContext = `
        Patient: ${MOCK_PROFILE.name}
        Injury: ${MOCK_PROFILE.injury}
        Current Phase: ${MOCK_PROFILE.currentPhase}
        Recent History:
        ${MOCK_HISTORY.slice(-3).map(h => `- ${h.date}: Pain End ${h.painLevelEnd}/10, Issues: ${h.flaggedIssues.join(', ')}`).join('\n')}
      `;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [emergencyStopTool, logPainTool] }],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `
            You are "NeuroAI", an expert neuro-rehabilitation coach.
            CONTEXT: ${patientContext}
            TASK: Monitor "Seated Trunk Rotations".
            PROTOCOL:
            1. IMMEDIATE GREETING: "Good to see you Alex. Let's start with 10 slow rotations. Match the Blue Orb's tempo."
            2. FEEDBACK: Short, punchy corrections. "Shoulders down", "Twist further", "Good tempo".
            3. SAFETY: Stop if pain reported.
          `,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setStatus('connected');
            setActive(true);
            shouldProcessFrames.current = true;

            // Audio Stream
            const source = inputCtx.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!micOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            // --- START VISUAL ANALYSIS LOOP ---
            const processLoop = () => {
              // Crucial fix: Check Ref instead of state to prevent closure staleness
              if (!shouldProcessFrames.current) return;
              
              const now = performance.now();
              const video = videoRef.current;
              const ac = analysisCanvasRef.current;
              
              if (video && ac && cameraOn) {
                  const ctx = ac.getContext('2d', { willReadFrequently: true });
                  if (ctx) {
                      // 1. Draw small frame (Mirrored to match UI)
                      ctx.save();
                      ctx.translate(ac.width, 0);
                      ctx.scale(-1, 1);
                      ctx.drawImage(video, 0, 0, ac.width, ac.height);
                      ctx.restore();
                      
                      // 2. Local Motion Analysis (at ~20 FPS)
                      if (now - lastProcessTimeRef.current > 50) {
                          const imageData = ctx.getImageData(0, 0, ac.width, ac.height);
                          if (lastFrameDataRef.current) {
                              // RUN ALGORITHM
                              const { score, centroidX } = calculateMotionMetrics(imageData.data, lastFrameDataRef.current, ac.width, ac.height);
                              
                              // Update Visuals
                              // Map centroid (-1 to 1) to angle (-35deg to 35deg)
                              // If I lean right (screen right), centroidX > 0.
                              // Rotation in SVG: Positive is Clockwise (Right lean).
                              setUserLean(centroidX * 35); 
                              
                              // Update Score (Stability is inverse of erratic motion unless moving)
                              setMatchScore(prev => {
                                const target = 100 - (score * 2); // Simple heuristic
                                return Math.floor(prev * 0.9 + target * 0.1); // Smooth it
                              });

                              setMetrics(prev => ({
                                stability: Math.max(0, 100 - (score * 5)),
                                rom: Math.min(100, Math.max(prev.rom, Math.abs(centroidX) * 100)), // Peak ROM
                                velocity: score
                              }));

                              // Rep Logic: Center -> Side -> Center
                              if (Math.abs(centroidX) > 0.3) {
                                  if (repStateRef.current === 'center') {
                                      repStateRef.current = centroidX > 0 ? 'right' : 'left';
                                  }
                              } else if (Math.abs(centroidX) < 0.1) {
                                  if (repStateRef.current !== 'center') {
                                      // Completed a rep
                                      setRepCount(c => c + 1);
                                      repStateRef.current = 'center';
                                      setVisualCue({ icon: Zap, text: "Good Rep!", color: "text-emerald-400" });
                                  }
                              }
                          }
                          lastFrameDataRef.current = imageData.data;
                          lastProcessTimeRef.current = now;
                      }

                      // 3. Send to Gemini (Throttled to 1 FPS for bandwidth)
                      if (now - lastGeminiSendTimeRef.current > 1000) {
                          ac.toBlob(async (blob) => {
                             if (blob) {
                               const base64 = await blobToBase64(blob);
                               sessionPromiseRef.current?.then(session => 
                                 session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 } })
                               );
                             }
                          }, 'image/jpeg', 0.5);
                          lastGeminiSendTimeRef.current = now;
                      }
                  }
              }
              
              analysisLoopRef.current = requestAnimationFrame(processLoop);
            };
            
            // Start the loop
            analysisLoopRef.current = requestAnimationFrame(processLoop);
          },
          onmessage: async (msg: LiveServerMessage) => {
             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                   if (fc.name === 'emergencyStop') {
                      setStatus('paused');
                      setAlertMessage(`Session Paused: ${fc.args.reason}`);
                      sessionPromiseRef.current?.then(s => s.sendToolResponse({
                        functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Session Paused on UI" } }]
                      }));
                   } else if (fc.name === 'logPain') {
                      const toast = document.createElement('div');
                      toast.className = "absolute top-24 right-4 bg-rose-500 text-white px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50 flex items-center gap-2";
                      toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> Pain Level ${fc.args.level} Logged`;
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 3000);
                      sessionPromiseRef.current?.then(s => s.sendToolResponse({
                        functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Logged" } }]
                      }));
                   }
                }
             }

             const outputText = msg.serverContent?.outputTranscription?.text;
             if (outputText) {
               setAiCaption(prev => {
                 if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
                 captionTimeoutRef.current = window.setTimeout(() => setAiCaption(''), 5000);
                 return prev + outputText;
               });
             }
             
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputCtx) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                const now = outputCtx.currentTime;
                const start = Math.max(nextStartTimeRef.current, now);
                source.start(start);
                nextStartTimeRef.current = start + audioBuffer.duration;
             }
          },
          onclose: () => {
             console.log("Gemini Closed");
             shouldProcessFrames.current = false;
             if (status !== 'summary') setStatus('idle');
             setActive(false);
             if (analysisLoopRef.current) cancelAnimationFrame(analysisLoopRef.current);
          },
          onerror: (e) => {
            console.error(e);
            shouldProcessFrames.current = false;
            setStatus('error');
          }
        }
      });
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const endSession = () => {
    shouldProcessFrames.current = false;
    sessionPromiseRef.current?.then(s => s.close());
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (analysisLoopRef.current) cancelAnimationFrame(analysisLoopRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    setActive(false);
    setStatus('summary');
  };

  useEffect(() => { return () => { if(active) endSession(); } }, []);

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
      
      {/* SUMMARY SCREEN */}
      {status === 'summary' && (
        <PostSessionSummary metrics={metrics} onDismiss={() => setStatus('idle')} />
      )}

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-center text-white pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${status === 'connected' ? 'bg-emerald-500 text-emerald-500 animate-pulse' : status === 'preparing' ? 'bg-sky-500 text-sky-500' : 'bg-rose-500 text-rose-500'}`} />
          <span className="font-bold tracking-widest text-xs md:text-sm uppercase flex items-center gap-2">
            NeuroAI Vision {status === 'connected' && <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px]">LIVE</span>}
          </span>
        </div>
      </div>

      {/* --- MAIN STAGE --- */}
      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        
        {/* 1. START SCREEN */}
        {status === 'idle' && (
           <div className="z-30 text-center space-y-6 px-4 animate-fade-in-up">
             <div className="w-24 h-24 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6 relative border border-white/10">
               <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50"></div>
               <Video className="w-10 h-10 text-primary" />
             </div>
             <h2 className="text-2xl font-bold text-white">Let's Get Moving, Alex.</h2>
             <p className="text-slate-400 max-w-sm mx-auto text-sm">Today: <strong className="text-white">Seated Trunk Rotations</strong>. <br/>Find a chair with good lighting.</p>
             <button 
               onClick={prepareSession}
               className="bg-primary hover:bg-sky-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_50px_rgba(14,165,233,0.6)] transition-all flex items-center gap-3 mx-auto"
             >
               <Camera className="w-5 h-5" /> Enter Setup Mode
             </button>
           </div>
        )}

        {/* 2. PREPARATION PHASE */}
        {status === 'preparing' && (
           <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 pb-24">
              <div className="text-center bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-md mx-auto animate-fade-in-down pointer-events-none">
                <h3 className="text-xl font-bold text-white mb-1">Align Your Body</h3>
                <p className="text-slate-300 text-sm">Position yourself so your upper body fits in the box.</p>
              </div>
              
              {/* Static Target Box for Prep */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[70%] border-4 border-dashed border-white/30 rounded-[3rem] pointer-events-none"></div>

              <div className="text-center animate-fade-in-up relative z-40">
                 <button 
                   onClick={startCountdown}
                   className="bg-emerald-500 hover:bg-emerald-400 text-white px-12 py-4 rounded-full font-bold text-lg shadow-2xl transition-all"
                 >
                   I'm Ready & Positioned
                 </button>
              </div>
           </div>
        )}

        {/* 3. COUNTDOWN OVERLAY */}
        {status === 'countdown' && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center">
             <div className="text-9xl font-black text-white animate-[ping_1s_ease-in-out_infinite]">{countdown}</div>
          </div>
        )}
        
        {/* 4. LOADING SPINNER */}
        {status === 'connecting' && (
            <div className="text-white flex flex-col items-center gap-4 z-30">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="font-mono text-sm tracking-wider text-primary/80 animate-pulse">CONNECTING NEURO-CORE...</p>
            </div>
        )}

        {/* 5. PAUSED STATE */}
        {status === 'paused' && (
           <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
             <PauseCircle className="w-20 h-20 text-amber-500 mb-6" />
             <h3 className="text-3xl font-bold">Session Paused</h3>
             <p className="mt-4 text-xl text-amber-200 max-w-md">{alertMessage}</p>
             <button onClick={() => { setStatus('connected'); setAlertMessage(null); }} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all">
               Resume Session
             </button>
           </div>
        )}

        {/* VIDEO ELEMENT (Mirrored for better UX) */}
        <video 
          ref={videoRef} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-x-[-1] ${status === 'idle' || status === 'summary' ? 'opacity-20 blur-sm grayscale' : 'opacity-100'}`}
          muted 
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* --- AUGMENTED REALITY HUD (Connected) --- */}
        {status === 'connected' && (
          <>
             {/* A. Rhythm Flow Guide (BOTTOM) */}
             <RhythmGuide active={true} />
             
             {/* B. Stick Figure Guide (Target Form) - LEFT */}
             <StickFigureGuide />

             {/* C. User Skeleton (Digital Mirror) - RIGHT */}
             {/* Passes the calculated lean angle to animate the skeleton */}
             <UserSkeleton leanAngle={userLean} />

             {/* D. Central Scoreboard - TOP CENTER */}
             <Scoreboard score={matchScore} reps={repCount} />

             {/* E. Dynamic Target Zone (Breathing) */}
             <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[70%] border-2 border-dashed border-emerald-500/30 rounded-[3rem] animate-[pulse_3s_infinite]"></div>
             </div>

             {/* F. Smart Visual Cues */}
             {visualCue && (
                <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-lg px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 animate-bounce-in z-30">
                   {React.createElement(visualCue.icon, { className: `w-6 h-6 ${visualCue.color} animate-pulse` })}
                   <span className="text-white font-bold tracking-wide">{visualCue.text}</span>
                </div>
             )}

             {/* G. Live Subtitles */}
             <div className="absolute bottom-28 left-4 right-4 flex justify-center z-30 pointer-events-none">
                {aiCaption ? (
                  <div className="bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-lg font-medium shadow-xl border border-white/10 max-w-2xl text-center leading-relaxed">
                    <span className="text-sky-400 font-bold mr-2 text-xs uppercase tracking-wider block mb-1">Coach Neuro</span> 
                    {aiCaption}
                  </div>
                ) : null}
             </div>
          </>
        )}
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="bg-slate-950 border-t border-white/5 p-4 z-30 flex justify-center items-center gap-8 pb-8 md:pb-6">
        {status === 'preparing' ? (
           <button onClick={() => setStatus('idle')} className="text-slate-400 hover:text-white font-medium">Cancel Setup</button>
        ) : (
          <>
            <button 
               onClick={() => setMicOn(!micOn)}
               className={`p-4 rounded-full transition-all border ${micOn ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
            >
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button 
               onClick={active ? endSession : prepareSession}
               className={`p-6 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95
                 ${active ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-900/40' : 'bg-primary text-white hover:bg-sky-500 shadow-sky-900/40'}`}
            >
               {active ? <div className="w-8 h-8 bg-white rounded-sm" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button 
               onClick={() => setCameraOn(!cameraOn)}
               className={`p-4 rounded-full transition-all border ${cameraOn ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
            >
              {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          </>
        )}
      </div>

      {/* ERROR MODAL */}
      {status === 'error' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-red-500/30 text-white p-8 rounded-3xl text-center shadow-2xl z-50 w-80">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Camera Error</h3>
              <p className="text-slate-400 mb-6 text-sm">We couldn't access your camera. Please check permissions.</p>
              <button onClick={() => setStatus('idle')} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200">Try Again</button>
          </div>
      )}
    </div>
  );
};

export default LiveSession;