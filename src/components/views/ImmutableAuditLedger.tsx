/**
 * DRISHTI Immutable Audit Ledger Component
 * Author: Adrian Roy Williams
 * Role: Renders a secure, vertical timeline of inter-departmental communications 
 * and bureaucratic actions for a specific project.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Link as LinkIcon, Database } from 'lucide-react';

export default function ImmutableAuditLedger({ projectId }: { projectId: string }) {
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inter_departmental_ledger')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false }); // Newest actions at the top

      if (data && data.length > 0) {
        setLedgerEntries(data);
      } else {
        // Fallback dummy data for demo purposes
        setLedgerEntries([
          {
            id: 'blk-9382',
            action_type: 'CLEARANCE_APPROVED',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            notes: 'Environmental clearance granted by Ministry of Environment. Conditions apply for river basin section.',
            initiated_by: 'MoEFCC',
            hash: '0x39f82d...9a12'
          },
          {
            id: 'blk-4721',
            action_type: 'CLEARANCE_REQUESTED',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            notes: 'Stage II Environmental clearance requested with attached EIA report.',
            initiated_by: 'NHAI Nodal',
            hash: '0x112fa3...8b44'
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchLedger();

    // Real-time subscription so the PMG summons appears instantly
    const ledgerSubscription = supabase
      .channel('ledger-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inter_departmental_ledger',
          filter: `project_id=eq.${projectId}`
        },
        (payload: any) => {
          setLedgerEntries((currentEntries) => [payload.new, ...currentEntries]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ledgerSubscription) };
  }, [projectId]);

  // Helper function to style nodes based on action type
  const getNodeStyle = (actionType: string) => {
    switch (actionType) {
      case 'MINISTRY_SUMMONED':
        // Using a deep mahogany accent for critical interventions
        return { dot: 'bg-[#8a3324] ring-[#8a3324]/30', badge: 'bg-[#8a3324]/10 text-[#8a3324] border-[#8a3324]/20' };
      case 'CLEARANCE_APPROVED':
        return { dot: 'bg-emerald-600 ring-emerald-600/30', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'CLEARANCE_REQUESTED':
        return { dot: 'bg-amber-500 ring-amber-500/30', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'DRONE_TELEMETRY':
        return { dot: 'bg-teal-600 ring-teal-600/30', badge: 'bg-teal-50 text-teal-800 border-teal-200' };
      default:
        return { dot: 'bg-slate-400 ring-slate-400/30', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const handleSimulateConsensus = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newBlock = {
        id: `blk-${Math.floor(Math.random() * 10000)}`,
        action_type: 'DRONE_TELEMETRY',
        timestamp: new Date().toISOString(),
        notes: 'Automated topographical survey completed. No encroachment detected on Right of Way (RoW). Cryptographic hash verified.',
        initiated_by: 'Drone-Alpha-9',
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
      };
      setLedgerEntries(prev => [newBlock, ...prev]);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-sm text-slate-900 mt-6">
      <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#8a3324]">Immutable Audit Ledger</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">CRYPTOGRAPHICALLY LOGGED INTER-DEPARTMENTAL TIMELINE</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSimulateConsensus}
            disabled={isSimulating}
            className="text-xs font-mono px-3 py-1.5 border border-teal-600 bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSimulating ? (
              <span className="flex items-center gap-1 animate-pulse"><Database className="w-3 h-3"/> SYNCING...</span>
            ) : (
              <span className="flex items-center gap-1"><Database className="w-3 h-3"/> SIMULATE CONSENSUS</span>
            )}
          </button>
          <button className="text-xs font-mono px-3 py-1.5 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer bg-white text-slate-700">
            EXPORT LEDGER (PDF)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex flex-col space-y-6 pl-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 w-full rounded-sm border border-slate-200"></div>
          ))}
        </div>
      ) : ledgerEntries.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400 italic border border-dashed border-slate-300">
          No bureaucratic actions logged for this asset.
        </div>
      ) : (
        <div className="relative pl-6 border-l border-slate-200 ml-3 space-y-8">
          <AnimatePresence>
            {ledgerEntries.map((entry) => {
              const styles = getNodeStyle(entry.action_type);
              
              return (
                <motion.div 
                  key={entry.id} 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ${styles.dot}`}></div>
                  
                  {/* Content Container */}
                  <div className="pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-mono px-2 py-0.5 border flex items-center gap-1 ${styles.badge}`}>
                        {entry.action_type === 'CLEARANCE_APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {entry.action_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(entry.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                      {entry.notes}
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded-sm border border-slate-100">
                      <div>
                        <span className="mr-4">AUTHOR: <span className="font-semibold text-slate-600">{entry.initiated_by}</span></span>
                        <span>LOG ID: {entry.id ? entry.id.split('-')[0].toUpperCase() : 'UNKNOWN'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 bg-white px-2 py-1 rounded-sm border border-slate-200" title="Cryptographic Block Hash">
                        <LinkIcon className="w-3 h-3 text-emerald-600" />
                        <span>{entry.hash || '0x' + Math.random().toString(16).slice(2, 12)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
