/**
 * PAIMANA Web - PostgreSQL WebSocket Listener
 * Author: Adrian Roy Williams
 * Role: Maintains a persistent WebRTC/WebSocket tunnel to the Supabase Hub.
 * Intercepts edge telemetry (IoT, OSINT, ML) and mutates the Zustand store in real-time.
 */

import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePaimanaStore } from '../store/usePaimanaStore';

export function usePaimanaRealtime() {
  const activeProjectId = usePaimanaStore((state) => state.activeProjectId);
  const addEscalation = usePaimanaStore((state) => state.addEscalation);

  useEffect(() => {
    if (!activeProjectId) return;

    // 1. INITIATE WEBSOCKET MULTIPLEXER
    console.log(`[PAIMANA_ORBITAL_LINK] Establishing WebSocket for Asset: ${activeProjectId}`);

    const ledgerSubscription = supabase
      .channel(`asset_ledger_${activeProjectId}`)
      // 2. BIND TO POSTGRESQL WRITE-AHEAD LOG (WAL)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // We only care when the Python engine creates a new flag
          schema: 'public',
          table: 'inter_departmental_ledger',
          filter: `project_id=eq.${activeProjectId}`
        },
        (payload) => {
          const newFlag = payload.new;
          
          // 3. INJECT INTO ZUSTAND (Zero-Latency Mutator)
          console.warn(`[THREAT_DETECTED] Edge node fired event: ${newFlag.action_type}`);
          
          addEscalation({
            id: `ESC-${newFlag.id?.substring(0, 8).toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            timestamp: newFlag.timestamp || new Date().toISOString(),
            threat_vector: newFlag.action_type,
            project_id: newFlag.project_id,
            severity: 'CRITICAL',
            notes: newFlag.notes,
            // Fallback heuristics if the payload doesn't explicitly state the mandate
            algorithmic_mandate: newFlag.action_type.includes('TAMPERING') ? 'LEVY_FINANCIAL_PENALTY' : 'FREEZE_PFMS_TRANCHE',
            is_locked: true
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[PAIMANA_ORBITAL_LINK] Database WebSocket Locked. Telemetry streaming.');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[PAIMANA_ORBITAL_LINK] Severe WebSocket severance. Attempting reconnect...');
        }
      });

    // 4. PREVENT MEMORY LEAKS (Component Unmount Cleanup)
    return () => {
      console.log(`[PAIMANA_ORBITAL_LINK] Terminating WebSocket for Asset: ${activeProjectId}`);
      supabase.removeChannel(ledgerSubscription);
    };
  }, [activeProjectId, addEscalation]);
}
