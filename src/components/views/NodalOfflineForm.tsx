/**
 * DRISHTI Nodal Officer Offline-Sync Form
 * Author: Adrian Roy Williams
 * Role: Provides a resilient data-entry interface that caches telemetry in 
 * the browser during network drops and auto-syncs upon reconnection.
 * Upgraded with Advanced MoSPI parameters.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function NodalOfflineForm({ projectId }: { projectId: string }) {
  // 1. Core State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  const initialFormState = {
    physical_progress_pct: '',
    original_cost: '',
    anticipated_cost: '',
    original_commission_date: '',
    anticipated_commission_date: '',
    implementing_agency_level: 'State',
    bottlenecks: [] as string[],
    nodal_officer_remarks: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // 2. Network Listeners & Draft Retrieval
  useEffect(() => {
    // Load existing drafts from local storage on mount
    const cachedDraft = localStorage.getItem(`drishti_draft_${projectId}`);
    if (cachedDraft) {
      setFormData(JSON.parse(cachedDraft));
    } else {
      setFormData(initialFormState);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [projectId]);

  // 3. Auto-Sync Logic
  useEffect(() => {
    if (isOnline) {
      const cachedDraft = localStorage.getItem(`drishti_draft_${projectId}`);
      if (cachedDraft) {
        syncToSupabase(JSON.parse(cachedDraft));
      }
    }
  }, [isOnline, projectId]);

  // 4. Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    
    setFormData(updatedData);
    localStorage.setItem(`drishti_draft_${projectId}`, JSON.stringify(updatedData));
  };

  const handleBottleneckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    const updatedData = { ...formData, bottlenecks: selectedValues };
    setFormData(updatedData);
    localStorage.setItem(`drishti_draft_${projectId}`, JSON.stringify(updatedData));
  };

  const syncToSupabase = async (dataToSync: any) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('project_updates')
        .insert([{ project_id: projectId, ...dataToSync }]);

      if (error) throw error;

      localStorage.removeItem(`drishti_draft_${projectId}`);
      setFormData(initialFormState);
      setLastSynced(new Date().toLocaleTimeString());
      
    } catch (error: any) {
      console.error("Sync failed:", error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOnline) {
      syncToSupabase(formData);
    } else {
      alert('Network offline. Data saved locally as draft. Will auto-sync when connection is restored.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-sm w-full">
      {/* Header & Network Indicator */}
      <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#8a3324]">Advanced Site Telemetry</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">OFFLINE-FIRST DRAFTING ENABLED</p>
        </div>
        <div className={`px-3 py-1 font-mono text-xs border ${
          isOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isOnline ? '● ONLINE' : '○ OFFLINE (CACHING)'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Progress */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-1">PHYSICAL PROGRESS (%)</label>
            <input 
              type="number" 
              name="physical_progress_pct"
              value={formData.physical_progress_pct}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 text-sm focus:ring-1 focus:ring-[#8a3324] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-500 mb-1">AGENCY LEVEL</label>
            <select 
              name="implementing_agency_level"
              value={formData.implementing_agency_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 text-sm focus:ring-1 focus:ring-[#8a3324] outline-none bg-white"
            >
              <option value="State">State Government</option>
              <option value="Central">Central Agency</option>
              <option value="Private">Private Contractor</option>
              <option value="Joint">Joint Venture</option>
            </select>
          </div>
        </div>

        {/* Cost Matrix */}
        <div className="p-4 bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold mb-3 text-slate-700">Financial Metrics (₹ Cr)</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">ORIGINAL COST</label>
              <input 
                type="number" 
                name="original_cost"
                value={formData.original_cost}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">ANTICIPATED COST</label>
              <input 
                type="number" 
                name="anticipated_cost"
                value={formData.anticipated_cost}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 text-sm outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Time Matrix */}
        <div className="p-4 bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold mb-3 text-slate-700">Commissioning Timelines</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">ORIGINAL DATE</label>
              <input 
                type="date" 
                name="original_commission_date"
                value={formData.original_commission_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1">ANTICIPATED DATE</label>
              <input 
                type="date" 
                name="anticipated_commission_date"
                value={formData.anticipated_commission_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 text-sm outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Bottlenecks */}
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-1">ACTIVE BOTTLENECKS (Multi-select)</label>
          <select 
            multiple
            name="bottlenecks"
            value={formData.bottlenecks}
            onChange={handleBottleneckChange}
            className="w-full px-3 py-2 border border-slate-300 text-sm focus:ring-1 focus:ring-[#8a3324] outline-none bg-white h-24"
          >
            <option value="none">None - On Track</option>
            <option value="land_acquisition_dispute">Land Acquisition / RoW</option>
            <option value="environmental_clearance">Environmental Clearance</option>
            <option value="utility_shifting">Utility Shifting</option>
            <option value="equipment_shortage">Equipment Supply Shortage</option>
            <option value="law_and_order">Law & Order Issue</option>
            <option value="fund_constraints">Fund Constraints</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple issues.</p>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-500 mb-1">NODAL OFFICER REMARKS</label>
          <textarea 
            name="nodal_officer_remarks"
            value={formData.nodal_officer_remarks}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 text-sm focus:ring-1 focus:ring-[#8a3324] outline-none resize-none"
            placeholder="Log specific on-site details..."
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400">
            {lastSynced ? `LAST SYNC: ${lastSynced}` : 'NO RECENT SYNC'}
          </span>
          <button 
            type="submit" 
            disabled={isSyncing}
            className={`px-6 py-2 text-sm font-medium transition-colors border cursor-pointer ${
              isOnline 
                ? 'bg-[#8a3324] hover:bg-[#6b2519] text-white border-[#8a3324]' 
                : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
            }`}
          >
            {isSyncing ? 'SYNCING...' : isOnline ? 'SUBMIT TELEMETRY' : 'SAVE DRAFT (OFFLINE)'}
          </button>
        </div>
      </form>
    </div>
  );
}
