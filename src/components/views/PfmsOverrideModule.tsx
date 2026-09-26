/**
 * DRISHTI PFMS Cryptographic Override Module
 * Author: Adrian Roy Williams
 * Role: 2-Step Authorization UI for releasing frozen tranches.
 * Requires physical Security Token PIN for non-repudiation.
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, AlertTriangle, Loader2, KeyRound } from 'lucide-react';

interface PfmsOverrideModuleProps {
  selectedProject: {
    project_id: string;
    project_name?: string;
  };
  onOverrideSuccess: () => void;
}

type OverrideState = 'IDLE' | 'PIN_REQUIRED' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

export function PfmsOverrideModule({ selectedProject, onOverrideSuccess }: PfmsOverrideModuleProps) {
  const [overrideState, setOverrideState] = useState<OverrideState>('IDLE');
  const [authPin, setAuthPin] = useState('');

  const initiateOverride = () => {
    setOverrideState('PIN_REQUIRED');
    setAuthPin('');
  };

  const cancelOverride = () => {
    setOverrideState('IDLE');
    setAuthPin('');
  };

  const executeCryptographicRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPin.length < 6) return;

    setOverrideState('VERIFYING');

    try {
      // Invoke the secure Edge Function, passing the PIN and Project ID
      const { data, error } = await supabase.functions.invoke('drishti-pfms-override', {
        body: {
          project_id: selectedProject.project_id,
          auth_pin: authPin
        }
      });

      if (error) throw error;

      setOverrideState('SUCCESS');
      setTimeout(() => {
        onOverrideSuccess();
        setOverrideState('IDLE');
        setAuthPin('');
      }, 3000);

    } catch (error: any) {
      console.error('[DRISHTI] Cryptographic override failed:', error.message);
      setOverrideState('ERROR');
      setTimeout(() => setOverrideState('PIN_REQUIRED'), 2500);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <h3 className="text-[10px] font-mono font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
        <Lock className="w-3 h-3" />
        Financial Governance
      </h3>

      <AnimatePresence mode="wait">

        {/* STATE: IDLE — Show the initiation button */}
        {overrideState === 'IDLE' && (
          <motion.button
            key="idle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onClick={initiateOverride}
            className="w-full text-left px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors border border-slate-900 group"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              Authorize PFMS Tranche Release
            </span>
            <span className="block text-xs font-mono text-slate-400 mt-1 ml-6">
              Requires Hardware Token Signature
            </span>
          </motion.button>
        )}

        {/* STATE: PIN_REQUIRED or ERROR — Show the PIN input terminal */}
        {(overrideState === 'PIN_REQUIRED' || overrideState === 'ERROR') && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1e293b] p-4 border border-slate-700"
          >
            {/* Terminal header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <button
                onClick={cancelOverride}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
              >
                ABORT
              </button>
            </div>

            <label className="block text-[10px] font-mono text-emerald-400 mb-1">
              AWAITING PMG HARDWARE TOKEN PIN
            </label>
            <p className="text-[9px] font-mono text-slate-500 mb-3">
              ASSET: {selectedProject.project_name || selectedProject.project_id}
            </p>

            <form onSubmit={executeCryptographicRelease} className="flex gap-2">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-600 text-emerald-400 font-mono text-center tracking-[0.5em] py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
                placeholder="••••••"
              />
              <button
                type="submit"
                disabled={authPin.length < 6}
                className="px-5 py-2 bg-emerald-600 text-white font-mono text-xs font-bold disabled:bg-slate-700 disabled:text-slate-500 hover:bg-emerald-500 transition-colors shrink-0"
              >
                SIGN
              </button>
            </form>

            {/* PIN strength indicator */}
            <div className="flex gap-1 mt-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 transition-colors duration-150 ${
                    i < authPin.length ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {overrideState === 'ERROR' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 mt-3"
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <p className="text-[10px] font-mono text-red-400">
                  INVALID SIGNATURE. CRYPTOGRAPHIC VERIFICATION REJECTED.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STATE: VERIFYING — Spinner */}
        {overrideState === 'VERIFYING' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#1e293b] p-5 border border-slate-700 text-center"
          >
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mx-auto mb-2" />
            <span className="text-[10px] font-mono text-emerald-400 block">
              VERIFYING CRYPTOGRAPHIC SIGNATURE...
            </span>
            <span className="text-[9px] font-mono text-slate-500 block mt-1">
              Contacting HSM Gateway
            </span>
          </motion.div>
        )}

        {/* STATE: SUCCESS — Confirmation */}
        {overrideState === 'SUCCESS' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-950 p-5 border border-emerald-700 text-center"
          >
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">
              TRANCHE RELEASE AUTHORIZED
            </span>
            <span className="text-[10px] font-mono text-emerald-500/80 block">
              IMMUTABLE LEDGER UPDATED. PFMS GATEWAY UNLOCKED.
            </span>
            <div className="mt-3 w-full h-0.5 bg-emerald-800 rounded overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="h-full bg-emerald-500"
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
