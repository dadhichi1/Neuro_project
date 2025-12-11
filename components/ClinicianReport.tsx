import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { generateClinicianReport } from '../services/geminiService';
import { MOCK_HISTORY } from '../constants';
import ReactMarkdown from 'react-markdown';

const ClinicianReport: React.FC = () => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateClinicianReport(MOCK_HISTORY);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Clinical Documentation</h2>
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Generate SOAP Note'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8 overflow-y-auto">
        {!report ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>No report generated yet.</p>
            <p className="text-sm">Click the button to have Gemini summarize recent session logs.</p>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none">
             <div className="flex justify-between items-start mb-6 border-b pb-4">
               <div>
                 <h1 className="text-2xl font-bold m-0">Weekly Progress Summary</h1>
                 <p className="text-slate-500">Patient: Alex Mercer | Date: {new Date().toLocaleDateString()}</p>
               </div>
               <button className="text-primary hover:underline text-sm flex items-center gap-1">
                 <Download className="w-4 h-4" /> Export PDF
               </button>
             </div>
             <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicianReport;