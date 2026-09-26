/**
 * PAIMANA Web - Zustand State Engine
 * Author: Adrian Roy Williams
 * Role: Atomic state manager handling live PFMS escrow states, OSINT clusters, 
 * and PMG escalations without triggering global React re-renders.
 */

import { create } from 'zustand';

export const usePaimanaStore = create((set, get) => ({
  // Core State
  activeProjectId: 'NHAI-SIH-2026-849',
  digitalTwinSectorLock: null,
  
  // The Apex Escalation Queue (Fed by Supabase WebSockets)
  escalations: [
    // Pre-loaded with a mock SAR Radar failure for the SIH presentation
    {
      id: 'ESC-9942',
      timestamp: new Date().toISOString(),
      threat_vector: 'SAR_RADAR_DISCREPANCY_FLAGGED',
      project_id: 'NHAI-SIH-2026-849',
      severity: 'CRITICAL',
      notes: 'Cloud-penetrating SAR analysis indicates high structural coherence (γ=0.92). Claimed progress (15%) is physically impossible.',
      algorithmic_mandate: 'FREEZE_PFMS_TRANCHE',
      is_locked: true
    }
  ],

  // Actions
  setActiveProject: (id) => set({ activeProjectId: id }),
  
  setSectorLock: (sectorId) => set({ digitalTwinSectorLock: sectorId }),
  
  addEscalation: (payload) => set((state) => ({
    escalations: [payload, ...state.escalations]
  })),

  resolveEscalation: (escalationId) => set((state) => ({
    escalations: state.escalations.filter(e => e.id !== escalationId)
  })),

  // Executes the PMG PIN Override
  executeCryptographicOverride: async (escalationId, pmPin) => {
    // In production, this fires a Supabase Edge Function to verify the PIN
    // and forcibly unlock the PFMS escrow.
    if (pmPin === '26103') { 
      get().resolveEscalation(escalationId);
      return true;
    }
    return false;
  }
}));
