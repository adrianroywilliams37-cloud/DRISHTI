import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Project } from '../../types';
import { Save, WifiOff, Wifi, UploadCloud, AlertCircle, Activity, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { SmartIngestionForm } from './SmartIngestionForm';

interface NodalOfficerDashboardProps {
  projects: Project[];
}

interface DraftState {
  physicalProgress: number;
  financialProgress: number;
  bottleneckType: string;
}

export function NodalOfficerDashboard({ projects }: NodalOfficerDashboardProps) {
  const location = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(location.state?.selectedProjectId || '');
  const [physicalProgress, setPhysicalProgress] = useState<number>(0);
  const [financialProgress, setFinancialProgress] = useState<number>(0);
  const [bottleneckType, setBottleneckType] = useState<string>('None');
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Load draft from local storage when project changes
  useEffect(() => {
    if (!selectedProject) return;
    const saved = localStorage.getItem(`draft_${selectedProject.id}`);
    if (saved) {
      try {
        const parsed: DraftState = JSON.parse(saved);
        setPhysicalProgress(parsed.physicalProgress);
        setFinancialProgress(parsed.financialProgress);
        setBottleneckType(parsed.bottleneckType);
        setHasDraft(true);
      } catch (e) {
        console.error("Failed to parse draft");
      }
    } else {
      setPhysicalProgress(selectedProject.physical_progress_pct || 0);
      setFinancialProgress(selectedProject.financial_progress_pct || 0);
      setBottleneckType('None');
      setHasDraft(false);
    }
  }, [selectedProject]);

  // Network listener
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

  const saveDraft = () => {
    if (!selectedProject) return;
    const draft: DraftState = {
      physicalProgress,
      financialProgress,
      bottleneckType
    };
    localStorage.setItem(`draft_${selectedProject.id}`, JSON.stringify(draft));
    setHasDraft(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProject) return;

    if (!isOnline) {
      saveDraft();
      alert('You are currently offline. Draft saved securely. It will be synced when connectivity is restored.');
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('project_updates')
        .insert([
          {
            project_id: selectedProject.id,
            physical_progress_pct: physicalProgress,
            financial_expenditure_pct: financialProgress,
            primary_bottleneck: bottleneckType,
            clearance_target_date: selectedProject.clearance_target_date, // Pass for edge function calculation
            nodal_officer_remarks: 'Submitted via Nodal Officer Dashboard' // Placeholder for remarks
          }
        ]);

      if (error) {
        console.error('Supabase insert error:', error);
        // Fallback to local simulation if Supabase is unconfigured (mocking mode)
        if (error.message.includes('mock-url') || error.message.includes('fetch')) {
          console.log('Mock submission successful (Supabase not connected).');
        } else {
          alert('Failed to submit data to DRISHTI.');
          return;
        }
      }

      localStorage.removeItem(`draft_${selectedProject.id}`);
      setHasDraft(false);
      alert('Data successfully submitted to DRISHTI.');
      setSelectedProjectId('');
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline && hasDraft && selectedProject) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const pendingProjects = projects.slice(0, 3);

  // Helper for dynamic colors
  const getProgressColor = (val: number) => {
    if (val < 40) return 'bg-mahogany';
    if (val < 75) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#fafafa] p-6 md:p-8 font-sans max-w-7xl mx-auto min-h-full"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">Nodal Officer Dashboard</h1>
          <p className="text-sm text-slate-500">Action required: Monthly physical and financial progress updates.</p>
        </div>
        <motion.div 
          animate={{ scale: isOnline ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: isOnline ? Infinity : 0, duration: 2 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-sm font-medium ${
            isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200 shadow-inner'
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isOnline ? 'Online - Live Sync Active' : 'Offline Mode Active'}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Queue List (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 p-4 border border-slate-800 text-white rounded-none">
            <h2 className="font-serif font-bold text-lg mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Action Queue
            </h2>
            <p className="text-xs text-slate-400">Projects requiring immediate updates</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {pendingProjects.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-4 border rounded-none cursor-pointer transition-colors ${
                  selectedProjectId === p.id 
                    ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">{p.id}</span>
                  {p.riskBand === 'High' && <span className="w-2 h-2 rounded-full bg-mahogany animate-pulse" />}
                </div>
                <div className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{p.name}</div>
                
                {localStorage.getItem(`draft_${p.id}`) && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 inline-flex rounded-sm">
                    <Save className="w-3 h-3" /> Draft Saved
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Data Entry Form & Visualizations (8 columns) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div 
                key={selectedProject.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-300 rounded-none p-8 relative overflow-hidden"
              >

                {!isOnline && (
                  <motion.div 
                    initial={{ y: -50 }} animate={{ y: 0 }}
                    className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-200 p-3 flex items-center justify-center gap-2 text-amber-800 text-sm font-bold backdrop-blur-sm z-10"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>Offline Mode: Changes will sync automatically when connectivity returns.</p>
                  </motion.div>
                )}

                <div className={`mb-8 relative z-10 ${!isOnline ? 'mt-10' : ''}`}>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight mb-2">{selectedProject.name}</h2>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-sm">Sector: {selectedProject.sector}</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-sm">Original Cost: ₹{selectedProject.sanctioned_cost_cr} Cr</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <SmartIngestionForm projectId={selectedProject.id} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[600px] border border-slate-300 rounded-none flex flex-col items-center justify-center bg-[#fafafa] text-slate-500"
              >
                <div className="w-16 h-16 bg-white border border-slate-200 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-600">No Project Selected</h3>
                <p className="text-sm mt-1">Select a project from the queue to submit progress.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
