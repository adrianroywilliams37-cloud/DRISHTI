import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Camera, UploadCloud, AlertTriangle, FileText, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';

interface SmartIngestionInterfaceProps {
  projectId: string;
}

export default function SmartIngestionInterface({ projectId }: SmartIngestionInterfaceProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [extractedData, setExtractedData] = useState<any>(null);
  
  // Interrogation state
  const [needsInterrogation, setNeedsInterrogation] = useState(false);
  const [interrogationDetails, setInterrogationDetails] = useState({ severity: '', impact: '' });
  
  // Hardware proof state
  const [hasHardwareProof, setHasHardwareProof] = useState(false);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simulate AI Scanning Delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false);
      // Mock extracted data with a vague bottleneck to trigger interrogation
      setExtractedData({
        physicalProgress: '62.5%',
        financialProgress: '58.0%',
        concretePoured: '450 cubic meters',
        bottleneck: 'Weather', // Intentional vague input
        date: new Date().toLocaleDateString()
      });
      setNeedsInterrogation(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [projectId]);

  const canCommit = !isScanning && extractedData && 
    (!needsInterrogation || (interrogationDetails.severity !== '' && interrogationDetails.impact !== '')) && 
    hasHardwareProof;

  const handleCommit = async () => {
    if (!canCommit) return;
    alert("Committed to DRISHTI Ledger successfully.");
    // In reality, we would send this to supabase.
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-200 rounded-sm overflow-hidden shadow-2xl min-h-[700px]">
      
      {/* LEFT PANE: Document Viewer */}
      <div className="bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-8 border-r border-slate-800">
        
        {/* Mock Document */}
        <div className="relative w-full max-w-sm aspect-[1/1.4] bg-white rounded-sm shadow-xl p-6 select-none opacity-90 transition-all duration-500">
          <div className="border-b-2 border-slate-900 pb-2 mb-4">
            <h3 className="font-serif font-bold text-xl uppercase tracking-widest">DPR Report</h3>
            <div className="text-xs text-slate-500 font-mono">{new Date().toISOString()}</div>
          </div>
          
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-20 bg-slate-100 border border-slate-200 rounded mt-6"></div>
            <div className="flex justify-between mt-4">
               <div className="h-4 bg-slate-200 rounded w-1/3"></div>
               <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
            
            {/* Vague Bottleneck Note */}
            <div className="mt-8 p-3 border border-red-200 bg-red-50 text-red-800 text-xs font-mono">
              NOTES: Delay expected due to Weather conditions at site.
            </div>
          </div>

          {/* Scanning Animation overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
              />
            )}
          </AnimatePresence>

          {/* Bounding boxes post-scan */}
          {!isScanning && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-[80px] left-[20px] right-[20px] h-[50px] border-2 border-green-500 bg-green-500/10 pointer-events-none" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-[80px] left-[20px] right-[20px] h-[100px] border-2 border-blue-500 bg-blue-500/10 pointer-events-none" />
            </>
          )}
        </div>

        {/* Status HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-950/80 backdrop-blur border border-slate-800 p-3 rounded-sm">
          <div className="flex items-center gap-2">
            {isScanning ? (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
            <span className="text-xs font-mono text-slate-300 uppercase">
              {isScanning ? 'AI VISION SYSTEM ACTIVE...' : 'EXTRACTION COMPLETE'}
            </span>
          </div>
          <FileText className="w-4 h-4 text-slate-500" />
        </div>
      </div>


      {/* RIGHT PANE: Telemetry & Augmentation Form */}
      <div className="bg-slate-50 p-8 flex flex-col relative">
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-serif font-bold text-slate-900">Telemetry & Augmentation</h2>
          <p className="text-xs text-slate-500 mt-1">Review AI-extracted data and augment missing variables.</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-24 space-y-6">
          {/* Extracted Data Box */}
          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-sm relative">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">AI Extraction Confidence: <span className="text-green-600">92%</span></h3>
            
            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm font-mono">Parsing structural data...</span>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">PHYSICAL_PROGRESS:</span>
                  <span className="text-slate-900 font-bold bg-slate-100 px-2 rounded-sm">{extractedData?.physicalProgress}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">FINANCIAL_PROGRESS:</span>
                  <span className="text-slate-900 font-bold bg-slate-100 px-2 rounded-sm">{extractedData?.financialProgress}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">CONCRETE_POURED:</span>
                  <span className="text-slate-900 font-bold bg-slate-100 px-2 rounded-sm">{extractedData?.concretePoured}</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-red-50 -mx-5 px-5">
                  <span className="text-red-700">BOTTLENECK_DETECTED:</span>
                  <span className="text-red-900 font-bold">{extractedData?.bottleneck}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Reactive Micro-Interrogation Module */}
          <AnimatePresence>
            {!isScanning && needsInterrogation && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border border-slate-200 border-l-4 border-l-[#8a3324] shadow-sm rounded-r-sm overflow-hidden"
              >
                <div className="bg-[#8a3324]/5 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#8a3324]" />
                  <span className="font-bold text-[#8a3324] text-sm">Low Fidelity Data Detected</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The extracted bottleneck <span className="font-mono bg-slate-100 px-1">"Weather"</span> is too vague for the DRISHTI prediction engine. Please expand on the severity and timeline impact.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Weather Severity</label>
                      <select 
                        className="w-full text-sm border-slate-200 rounded-sm focus:border-[#8a3324] focus:ring-[#8a3324]"
                        value={interrogationDetails.severity}
                        onChange={e => setInterrogationDetails({...interrogationDetails, severity: e.target.value})}
                      >
                        <option value="">Select Severity...</option>
                        <option value="minor_rain">Minor Rainfall</option>
                        <option value="monsoon_flooding">Monsoon Flooding (Severe)</option>
                        <option value="cyclone">Cyclone / Extreme Weather</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Impacted Timeline</label>
                      <select 
                        className="w-full text-sm border-slate-200 rounded-sm focus:border-[#8a3324] focus:ring-[#8a3324]"
                        value={interrogationDetails.impact}
                        onChange={e => setInterrogationDetails({...interrogationDetails, impact: e.target.value})}
                      >
                        <option value="">Select Impact...</option>
                        <option value="1_week">&lt; 1 Week</option>
                        <option value="1_month">1 - 4 Weeks</option>
                        <option value="critical">&gt; 1 Month (Critical)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hardware Proof Integration */}
          <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" /> Geotagged Evidence
            </h3>
            <p className="text-xs text-slate-500 mb-4">Requires Live Capture - Gallery Uploads Disabled</p>
            
            <div className={`relative border-2 border-dashed ${hasHardwareProof ? 'border-green-300 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} rounded-sm p-6 flex flex-col items-center justify-center transition-colors`}>
              {hasHardwareProof ? (
                <div className="flex flex-col items-center text-green-700">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <span className="text-sm font-bold">Proof Captured</span>
                  <span className="text-xs font-mono mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> 28.6139° N, 77.2090° E</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-600">Tap to activate camera</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={(e) => {
                      if(e.target.files && e.target.files.length > 0) {
                        setHasHardwareProof(true);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-5 flex items-center justify-between z-20">
          <div className="text-xs font-mono text-slate-500">
             {!isOnline ? <span className="text-amber-600 font-bold">OFFLINE Caching Mode</span> : "SECURE CONNECTION"}
          </div>
          <button 
            disabled={!canCommit}
            onClick={handleCommit}
            className={`px-6 py-3 rounded-sm font-bold text-sm flex items-center gap-2 transition-all ${
              canCommit 
                ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Commit to DRISHTI Ledger
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
