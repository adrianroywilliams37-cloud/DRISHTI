/**
 * DRISHTI Realtime Dashboard Alert Component
 * Author: Adrian Roy Williams
 * Role: Listens to Supabase WebSockets and flashes the UI when the ML engine detects a critical risk.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Your initialized client

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const [riskStatus, setRiskStatus] = useState<string>('Green');
  const [delayForecast, setDelayForecast] = useState<string>('Loading telemetry...');

  useEffect(() => {
    // 1. Fetch initial state on load
    const fetchInitialRisk = async () => {
      const { data } = await supabase
        .from('project_risk_assessments')
        .select('render_status, cascading_delay_prediction')
        .eq('project_id', projectId)
        .single();
        
      if (data) {
        setRiskStatus(data.render_status);
        setDelayForecast(data.cascading_delay_prediction);
      }
    };
    fetchInitialRisk();

    // 2. Subscribe to real-time ML updates from the Edge Function
    const riskSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Listen for when the Edge Function upserts new data
          schema: 'public',
          table: 'project_risk_assessments',
          filter: `project_id=eq.${projectId}` // Only listen to this specific project
        },
        (payload: any) => {
          // The payload.new object contains the exact row our Python API generated
          console.log('AI Telemetry Received!', payload.new);
          setRiskStatus(payload.new.render_status);
          setDelayForecast(payload.new.cascading_delay_prediction);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(riskSubscription);
    };
  }, [projectId]);

  // 3. Dynamic UI Rendering
  const statusColors: Record<string, string> = {
    Green: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 border-l-emerald-500',
    Amber: 'bg-amber-950/80 border-amber-500/30 text-amber-400 border-l-amber-500',
    BlinkingRed: 'bg-red-950/80 border-red-500/50 text-red-400 animate-pulse border-l-red-500', 
  };

  return (
    <div className={`p-4 rounded-none transition-all duration-300 border border-l-4 ${statusColors[riskStatus] || statusColors.Green} flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${riskStatus === 'BlinkingRed' ? 'bg-red-500 animate-ping' : riskStatus === 'Amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        <h2 className="text-sm uppercase font-bold font-sans tracking-widest text-slate-300">Predictive Risk Radar</h2>
      </div>
      <p className="font-mono text-xs uppercase tracking-wider">{delayForecast}</p>
    </div>
  );
}
