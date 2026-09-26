import React, { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Project, RiskBand } from "./types";
import { calculatePortfolioStats } from "./utils/riskEngine";
import { runModelBenchmarking } from "./utils/mlEngine";
import { usePersistentData } from "./hooks/usePersistentData";

import { LoginView } from "./components/views/LoginView";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AiQueryChatDrawer } from "./components/AiQueryChatDrawer";
import { MessageSquareText } from "lucide-react";

import { NodalOfficerDashboard } from "./components/views/NodalOfficerDashboard";
import { NodalSectorPortfolios } from "./components/views/NodalSectorPortfolios";
import { MinistryAnalystDashboard } from "./components/views/MinistryAnalystDashboard";
import { ApexDecisionMakerDashboard } from "./components/views/ApexDecisionMakerDashboard";
import { ProjectDetailView } from "./components/views/ProjectDetailView";
import { DocsTab } from "./components/DocsTab";
import { ValidationTab } from "./components/ValidationTab";
import { MinistryGridView } from "./components/views/MinistryGridView";
import { OrbitalVerificationUI } from "./components/views/OrbitalVerificationUI";
import { GlobalOrbitalVerifier } from "./components/views/GlobalOrbitalVerifier";
import { ContractorGenesisMatrix } from "./components/views/ContractorGenesisMatrix";
import { PredictiveRadar } from "./components/views/PredictiveRadar";
import { FiscalAnalyticsDashboard } from "./components/views/FiscalAnalyticsDashboard";
import { useParams } from "react-router-dom";

// Helper component that acts as the Command Center / Hub based on role
function DashboardHub({ projects, onSelectProject, variant = 'hub', isSectorView }: { projects: Project[], onSelectProject: (p: Project) => void, variant?: 'hub' | 'portfolio', isSectorView?: boolean }) {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'nodal') {
    if (variant === 'portfolio') {
      return <NodalSectorPortfolios projects={projects} />;
    }
    return <NodalOfficerDashboard projects={projects} />;
  }
  if (user.role === 'ministry') {
    return <MinistryAnalystDashboard projects={projects} onSelectProject={onSelectProject} />;
  }
  if (user.role === 'apex') {
    return <ApexDecisionMakerDashboard projects={projects} onSelectProject={onSelectProject} />;
  }
  if (user.role === 'master') {
    if (isSectorView) {
      return <ApexDecisionMakerDashboard projects={projects} onSelectProject={onSelectProject} />;
    }
    return (
      <div className="p-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-6">Master View</h1>
        <MinistryGridView projects={projects} />
      </div>
    );
  }

  return <div>Unknown Role</div>;
}

// Wrapper for Sector routing
function SectorDashboard({ projects, onSelectProject }: { projects: Project[], onSelectProject: (p: Project) => void }) {
  const { sectorId } = useParams();
  const filteredProjects = useMemo(() => {
    if (!sectorId) return projects;
    return projects.filter(p => p.sector === decodeURIComponent(sectorId));
  }, [projects, sectorId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-serif font-bold text-slate-900 mb-6 capitalize">{decodeURIComponent(sectorId || '')} Dashboard</h1>
      <DashboardHub projects={filteredProjects} onSelectProject={onSelectProject} variant="hub" isSectorView={true} />
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  
  // Use our new persistent caching data layer, passing the active user ID
  const { projects: rawProjects, loading } = usePersistentData(user?.id);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Run in-browser predictive ML benchmarking, ablation, and enrichment
  const mlResults = useMemo(() => {
    return runModelBenchmarking(rawProjects);
  }, [rawProjects]);

  const projects = mlResults.enrichedProjects;
  const benchmarkComparison = mlResults.comparison;
  const beforeAfterComparison = mlResults.beforeAfter;
  const driverCorrelations = mlResults.correlations;

  const stats = useMemo(() => calculatePortfolioStats(projects), [projects]);
  const navigate = useNavigate();

  // Show a simple loading state while resolving from cache/network
  if (loading && projects.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="text-xl font-serif text-slate-500 animate-pulse">Establishing Secure Uplink...</div></div>;
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    navigate(`/sector/${encodeURIComponent(project.sector)}/project/${project.id}`);
  };

  return (
    <>
      <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Command Center dynamically routes based on role */}
          <Route path="/" element={<DashboardHub projects={projects} onSelectProject={handleSelectProject} />} />
          <Route path="/sector/:sectorId" element={<SectorDashboard projects={projects} onSelectProject={handleSelectProject} />} />
          
          <Route path="/portfolio" element={
            <div className="p-6">
              <DashboardHub projects={projects} onSelectProject={handleSelectProject} variant="portfolio" />
            </div>
          } />

          <Route path="/radar" element={
            <ValidationTab
              comparison={benchmarkComparison}
              beforeAfter={beforeAfterComparison}
              correlations={driverCorrelations}
              stats={stats}
            />
          } />
          
          <Route path="/predictive-radar" element={<PredictiveRadar />} />

          <Route path="/fiscal-analytics" element={<FiscalAnalyticsDashboard projects={projects} />} />

          <Route path="/docs" element={<DocsTab />} />

          {/* Procurement / Genesis Node */}
          <Route path="/procurement" element={
            <div className="p-6">
              <ContractorGenesisMatrix />
            </div>
          } />

          {/* Orbital Verification for Ministry Analysts */}
          <Route path="/verify/:telemetryId" element={
            <div className="p-6">
              <OrbitalVerificationUI />
            </div>
          } />
          <Route path="/verify" element={
            <div className="p-6">
              <GlobalOrbitalVerifier projects={projects} />
            </div>
          } />

          {/* Detailed Project View Route */}
          {selectedProject && (
            <Route path="/sector/:sectorId/project/:id" element={<ProjectDetailView project={selectedProject} onClose={() => setSelectedProject(null)} />} />
          )}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      
      {/* Global AI Chat for Analyst, Apex and Master */}
      {user && (user.role === 'ministry' || user.role === 'apex' || user.role === 'master') && (
        <>
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-teal-800 text-teal-50 p-4 rounded-sm shadow-md hover:bg-teal-700 transition-colors border border-teal-600/30 group"
            title="Open DRISHTI Assistant"
          >
            <MessageSquareText className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          
          <AiQueryChatDrawer 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            projects={projects}
            modelMetrics={benchmarkComparison}
            driverRankings={driverCorrelations}
          />
        </>
      )}
    </>
  );
}
