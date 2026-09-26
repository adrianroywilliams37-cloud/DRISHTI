import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { motion } from 'motion/react';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface NodalSectorPortfoliosProps {
  projects: Project[];
}

export function NodalSectorPortfolios({ projects }: NodalSectorPortfoliosProps) {
  const navigate = useNavigate();

  // Group projects by sector
  const groupedProjects = useMemo(() => {
    return projects.reduce((acc, project) => {
      const sector = project.sector || 'Uncategorized';
      if (!acc[sector]) acc[sector] = [];
      acc[sector].push(project);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects]);

  const handleProjectClick = (projectId: string) => {
    // Navigate to root (Command Center) and pass the selected project ID in state
    navigate('/', { state: { selectedProjectId: projectId } });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-900 leading-tight">My Portfolios</h2>
        <p className="text-sm text-slate-500 mt-2">Select a project below to open it in the Smart Ingestion interface.</p>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedProjects).map(([sector, sectorProjects], index) => (
          <motion.div 
            key={sector}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
              <h3 className="text-lg font-serif font-bold text-slate-800 capitalize">{sector}</h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">
                {sectorProjects.length} {sectorProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sectorProjects.map((project) => (
                <div 
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="bg-white border border-slate-200 rounded-sm p-5 cursor-pointer group hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-sm border border-slate-100">{project.id}</span>
                      {project.riskBand === 'High' && (
                        <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-sm">
                          <AlertTriangle className="w-3 h-3" /> Critical
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                      {project.name}
                    </h4>
                    
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-6">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{project.state}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Progress Bars */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Physical Progress</span>
                        <span className="font-mono font-bold text-slate-900">{project.physical_progress_pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${project.physical_progress_pct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Financial Progress</span>
                        <span className="font-mono font-bold text-slate-900">{project.financial_progress_pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${project.financial_progress_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
