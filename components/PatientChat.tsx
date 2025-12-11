import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Info, BrainCircuit } from 'lucide-react';
import { createPatientChat } from '../services/geminiService';
import { MOCK_PROFILE, MOCK_HISTORY } from '../constants';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const PatientChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${MOCK_PROFILE.name.split(' ')[0]}, I'm your recovery assistant. I've reviewed your charts from the last ${MOCK_HISTORY.length} sessions. How are you feeling today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session once
    if (!chatRef.current) {
      chatRef.current = createPatientChat(MOCK_PROFILE, MOCK_HISTORY);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Therapist Assistant</h2>
            <p className="text-xs text-slate-500">Gemini 3 Pro • Context Aware</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
          <Info className="w-3 h-3" />
          <span>Has access to your full medical history</span>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
              ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-primary text-white'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed 
              ${msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your pain, exercises, or progress..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-primary hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          AI can make mistakes. Always follow your physiotherapist's direct instructions.
        </p>
      </div>
    </div>
  );
};

export default PatientChat;
