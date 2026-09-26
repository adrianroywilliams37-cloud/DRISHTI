import React, { useEffect, useState } from 'react';
import { Project } from '../../types';
import { usePersistentData } from '../../hooks/usePersistentData';
import { Activity, AlertTriangle, Clock, ServerCrash, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface MLPrediction {
  project_id: string;
  timestamp: string;
  analysis_summary: {
    ai_risk_score: 'Critical' | 'High' | 'Moderate' | 'Low';
    anomaly_score: number;
  };
  visualization_input: {
    render_status: 'BlinkingRed' | 'Amber' | 'Green';
    cascading_delay_prediction: string;
  };
}

export function PredictiveRadar() {
  const [predictions, setPredictions] = useState<Record<string, MLPrediction>>({});
  const [loading, setLoading] = useState(true);
  
  // Use persistent hook instead of static seedProjects
  const { projects: seedProjects, loading: projectsLoading } = usePersistentData();

  useEffect(() => {
    if (projectsLoading) return; // Wait for projects to load
    
    const fetchPredictions = async () => {
      try {
        const results: Record<string, MLPrediction> = {};
        // Fetch predictions for all active projects
        for (const project of seedProjects) {
          // Prepare a dummy feature vector based on project stats to feed the ML model
          const featureVector = [
            project.financial_progress_pct, 
            project.physical_progress_pct, 
            project.scheduleSlipMonths,
            project.costOverrunPct,
            project.risk_score
          ];

          const response = await fetch('http://localhost:8000/predict-risk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: project.id,
              vectorized_features: featureVector
            })
          });
          
          if (response.ok) {
            const data: MLPrediction = await response.json();
            results[project.id] = data;
          }
        }
        setPredictions(results);
      } catch (error) {
        console.error("Failed to fetch ML predictions from FastAPI", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    // Simulate real-time streaming updates every 15 seconds
    const interval = setInterval(fetchPredictions, 15000);
    return () => clearInterval(interval);
  }, [seedProjects, projectsLoading]);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 border-b border-slate-700 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
              <Zap className="text-amber-500 w-8 h-8" />
              ML Predictive Risk Radar
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm uppercase tracking-widest">
              Live Isolation Forest Inference • Port 8000
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 border border-slate-600">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono text-xs uppercase text-slate-300">
              {loading ? 'Ingesting Vectors...' : 'Model Online'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seedProjects.map(project => {
            const pred = predictions[project.id];
            
            // Default styling if prediction hasn't loaded yet
            let borderColor = 'border-slate-700';
            let bgAccent = 'bg-slate-800';
            let textAccent = 'text-slate-300';
            let Icon = Activity;
            let isBlinking = false;

            if (pred) {
              if (pred.visualization_input.render_status === 'BlinkingRed') {
                borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                bgAccent = 'bg-red-900/20';
                textAccent = 'text-red-400';
                Icon = AlertTriangle;
                isBlinking = true;
              } else if (pred.visualization_input.render_status === 'Amber') {
                borderColor = 'border-amber-500';
                bgAccent = 'bg-amber-900/20';
                textAccent = 'text-amber-400';
                Icon = Clock;
              } else {
                borderColor = 'border-emerald-500';
                bgAccent = 'bg-emerald-900/20';
                textAccent = 'text-emerald-400';
                Icon = Activity;
              }
            }

            return (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden bg-slate-900 border ${borderColor} p-5 flex flex-col`}
              >
                {/* Background scanning effect */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400 border border-slate-700">
                    {project.id}
                  </div>
                  <Icon className={`w-5 h-5 ${textAccent} ${isBlinking ? 'animate-pulse' : ''}`} />
                </div>

                <h3 className="font-serif font-bold text-lg text-white mb-1 line-clamp-1 relative z-10">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mb-6 font-mono relative z-10">
                  {project.sector}
                </p>

                {!pred ? (
                  <div className="mt-auto h-24 flex items-center justify-center border border-slate-800 bg-slate-900/50 relative z-10">
                    <span className="font-mono text-xs text-slate-500 animate-pulse">Awaiting inference...</span>
                  </div>
                ) : (
                  <div className={`mt-auto border border-slate-700/50 ${bgAccent} p-4 relative z-10`}>
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                          Risk Severity
                        </span>
                        <span className={`font-mono font-bold text-sm ${textAccent}`}>
                          {pred.analysis_summary.ai_risk_score.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                          Anomaly Score
                        </span>
                        <span className="font-mono text-sm text-slate-300">
                          {pred.analysis_summary.anomaly_score.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-700/50 pt-3 mt-1">
                      <p className="text-xs text-slate-300 font-mono leading-relaxed">
                        {pred.visualization_input.cascading_delay_prediction}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
