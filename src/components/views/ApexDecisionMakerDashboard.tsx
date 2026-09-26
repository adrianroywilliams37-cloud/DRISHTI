/**
 * DRISHTI PMG Escalation Queue
 * Author: Adrian Roy Williams
 * Role: Global realtime inbox for Apex Decision-Makers. Catches 'Critical' 
 * AI alerts and provides immediate bureaucratic action nodes.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PfmsOverrideModule } from './PfmsOverrideModule';
import { EnvironmentalNode } from './EnvironmentalNode';
import { BiometricFraudNode } from './BiometricFraudNode';
import { OsintConsensusView } from './OsintConsensusView';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from './CreateProjectModal';
import { PasswordConfirmModal } from './PasswordConfirmModal';
import { useAuth } from '../../context/AuthContext';

// In App.tsx this component is passed props, we accept them to avoid type errors
// but we fetch our own data for the global queue.
export function ApexDecisionMakerDashboard(props: any) {
  const [criticalProjects, setCriticalProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch the initial backlog of Critical projects
    const fetchCriticalBacklog = async () => {
      const { data, error } = await supabase
        .from('project_risk_assessments')
        .select(`
          project_id,
          project_name,
          ministry_name,
          cascading_delay_prediction,
          anomaly_score,
          last_updated
        `)
        .eq('ai_risk_score', 'Critical')
        .order('anomaly_score', { ascending: true }); // Most severe anomalies first (most negative)

      if (data) setCriticalProjects(data);
    };

    fetchCriticalBacklog();

    // 2. Global Real-time Listener
    const globalQueueSubscription = supabase
      .channel('pmg-global-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_risk_assessments' },
        (payload: any) => {
          const updatedRow = payload.new;
          
          setCriticalProjects((currentQueue) => {
            // If a project escalates to Critical, add/update it in the queue
            if (updatedRow.ai_risk_score === 'Critical') {
              const exists = currentQueue.find(p => p.project_id === updatedRow.project_id);
              if (exists) {
                return currentQueue.map(p => p.project_id === updatedRow.project_id ? updatedRow : p);
              }
              return [updatedRow, ...currentQueue];
            } 
            // If a project is downgraded (risk mitigated), remove it from the queue
            else {
              return currentQueue.filter(p => p.project_id !== updatedRow.project_id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalQueueSubscription);
    };
  }, []);

  const handleSummonMinistry = async (projectId: string) => {
      setIsSummoning(true);
      try {
          const { data, error } = await supabase.functions.invoke('drishti-summon-ministry', {
              body: { project_id: projectId }
          });
  
          if (error) throw error;
          
          // Temporarily change button state to show success
          alert(`Success: Summons dispatched for project ${projectId}. The ledger has been updated.`);
          
      } catch (error: any) {
          console.error("Failed to summon ministry:", error.message);
      } finally {
          setIsSummoning(false);
      }
  };

  const handleOverrideSuccess = () => {
    // Remove the project from the local queue since it's been downgraded
    if (selectedProject) {
      setCriticalProjects(prev => prev.filter(p => p.project_id !== selectedProject.project_id));
      setSelectedProject(null);
    }
  };

  const handleAcknowledge = (projectId: string) => {
    // Remove from local queue without taking action
    setCriticalProjects(prev => prev.filter(p => p.project_id !== projectId));
    setSelectedProject(null);
  };

  const handleCreateProject = async (data: any, password: string) => {
    const response = await fetch('/api/projects/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || '',
        'x-password': password
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create project');
    }
    
    setShowCreateModal(false);
    alert('Project successfully created and added to the ledger.');
  };

  const handleMarkComplete = async (password: string) => {
    if (!selectedProject) return;
    const response = await fetch('/api/projects/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || '',
        'x-password': password
      },
      body: JSON.stringify({ id: selectedProject.project_id })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to complete project');
    }
    
    setShowCompleteConfirm(false);
    setCriticalProjects(prev => prev.filter(p => p.project_id !== selectedProject.project_id));
    setSelectedProject(null);
    alert('Project successfully marked as completed.');
  };

  return (
    // Asymmetrical Layout: 8-column Queue, 4-column Action Panel on warm canvas
    <div className="grid grid-cols-12 min-h-[calc(100vh-64px)] bg-[#F9FAFB] text-slate-900 border-t border-slate-200">
      
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {showCompleteConfirm && (
        <PasswordConfirmModal
          actionName={`Mark Project ${selectedProject?.project_id} as Complete`}
          onClose={() => setShowCompleteConfirm(false)}
          onConfirm={handleMarkComplete}
        />
      )}

      {/* LEFT COLUMN: The Escalation Inbox */}
      <div className="col-span-8 p-8 border-r border-slate-200 overflow-y-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-800">Escalation Queue</h1>
            <p className="text-sm text-slate-500 font-mono mt-1">
              {criticalProjects.length} Mega-Projects requiring Cabinet-level intervention
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-mono border border-indigo-300 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
            >
              [ + NEW PROJECT ]
            </button>
            <button className="text-xs font-mono border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50">
              [ OPEN FISCAL ANALYTICS ]
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          {criticalProjects.length === 0 ? (
            <div className="p-6 border border-slate-200 bg-white text-slate-400 text-sm italic">
              Queue is clear. No critical anomalies detected by the inference engine.
            </div>
          ) : (
            criticalProjects.map((project) => (
              <div 
                key={project.project_id}
                onClick={() => setSelectedProject(project)}
                className={`p-4 bg-white border cursor-pointer transition-all ${
                  selectedProject?.project_id === project.project_id 
                  ? 'border-red-400 shadow-sm ring-1 ring-red-400/20' 
                  : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{project.project_name || project.project_id}</h3>
                    <span className="text-xs uppercase font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm mt-1 inline-block">
                      {project.ministry_name || 'Line Ministry'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                      Score: {project.anomaly_score?.toFixed(3)}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                      Updated: {new Date(project.last_updated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 border-l-2 border-red-300 pl-3">
                  {project.cascading_delay_prediction}
                </p>
              </div>
            ))
          )}
        </div>

        {/* ACTIVE PORTFOLIO: Show all projects from props */}
        <div className="mt-12">
          <h2 className="text-lg font-serif font-bold border-b border-slate-200 pb-3 mb-6">
            Active Portfolio ({props.projects?.length || 0})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {props.projects?.map((project: any) => (
              <div 
                key={project.id}
                onClick={() => props.onSelectProject?.(project)}
                className="bg-white border border-slate-200 p-4 cursor-pointer hover:border-slate-400 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-sm border border-slate-100">
                    {project.id}
                  </span>
                  <div className={`px-2 py-1 rounded-sm text-xs font-bold ${
                    project.riskBand === 'High' ? 'bg-red-50 text-red-600' :
                    project.riskBand === 'Medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {project.riskBand}
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 mb-1 line-clamp-2 leading-tight">
                  {project.name}
                </h4>
                <div className="flex justify-between text-xs text-slate-500 mt-3">
                  <span>Physical: {project.physical_progress_pct}%</span>
                  <span>Financial: {project.financial_progress_pct}%</span>
                </div>
              </div>
            ))}
            
            {(!props.projects || props.projects.length === 0) && (
              <div className="col-span-full p-6 text-center text-slate-400 italic bg-white border border-slate-200">
                No active projects in this sector portfolio.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Action / Decision Node Workspace */}
      <div className="col-span-4 p-8 bg-white relative">
        {selectedProject ? (
          <div className="sticky top-8">
            <h2 className="text-lg font-serif font-bold border-b border-slate-200 pb-3 mb-6">
              Intervention Node
            </h2>
            
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-[#F9FAFB] border border-slate-200 text-sm">
                <span className="block text-xs font-mono text-slate-500 mb-1">SELECTED ASSET</span>
                <span className="font-bold text-slate-800">{selectedProject.project_name || selectedProject.project_id}</span>
              </div>
            </div>

            {/* Bureaucratic Action Buttons - Tactile, no heavy shadows */}
            <div className="space-y-3">
              <button 
                  onClick={() => handleSummonMinistry(selectedProject.project_id)}
                  disabled={isSummoning}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border 
                      ${isSummoning 
                          ? 'bg-red-400 text-white border-red-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-700 cursor-pointer'
                      }`}
              >
                  {isSummoning ? 'Dispatching Summons...' : 'Summon Line Ministry'}
                  <span className="block text-xs font-normal text-red-200 mt-0.5">
                      Issues automated summons for next Cabinet review
                  </span>
              </button>

              <button 
                onClick={() => handleAcknowledge(selectedProject.project_id)}
                className="w-full text-left px-4 py-3 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors border border-slate-200 border-dashed cursor-pointer"
              >
                Acknowledge & Monitor
                <span className="block text-xs font-normal text-slate-400 mt-0.5">Clears from queue without action</span>
              </button>

              <button 
                onClick={() => setShowCompleteConfirm(true)}
                className="w-full text-left px-4 py-3 bg-white hover:bg-green-50 text-green-700 text-sm font-medium transition-colors border border-green-200 cursor-pointer"
              >
                Mark Project as Complete
                <span className="block text-xs font-normal text-green-500 mt-0.5">Closes out the project (Requires Password)</span>
              </button>
            </div>

            {/* PFMS Cryptographic Override Module */}
            <PfmsOverrideModule
              selectedProject={selectedProject}
              onOverrideSuccess={handleOverrideSuccess}
            />

            {/* NGT Environmental IoT Node */}
            <div className="mt-4">
              <EnvironmentalNode 
                projectId={selectedProject.project_id} 
                pm10Level={102.5} // Mock data for SIH demo representing a breach
                isCompliant={false} 
              />
            </div>

            {/* Biometric Liveness Spoofing Node */}
            <div className="mt-4">
              <BiometricFraudNode projectId={selectedProject.project_id} />
            </div>

            {/* OSINT Sybil Defense Node */}
            <div className="mt-4">
              <OsintConsensusView 
                projectId={selectedProject.project_id}
                bhashiniText="They haven't built the foundation but they claimed 20% progress on the app."
                clusterWeight={1.85}
                activeReports={12}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Select a critical asset from the queue to take action.
          </div>
        )}
      </div>

    </div>
  );
}
