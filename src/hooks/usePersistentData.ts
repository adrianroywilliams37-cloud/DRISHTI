import { useState, useEffect } from 'react';
import { Project } from '../types';

import { seedProjects } from '../data/seedProjects';

export function usePersistentData(activeUserId: string = 'user_nodal_1') {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      // 1. Try to load from local cache instantly for memory behavior
      const cached = localStorage.getItem('infrapulse_projects_cache');
      if (cached) {
        try {
          setProjects(JSON.parse(cached));
          setLoading(false); // Instantly stop loading if cache exists
        } catch (e) {
          console.error("Cache parsing error", e);
        }
      }

      // 2. Fetch fresh data from backend
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'x-user-id': activeUserId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          // Update local cache
          localStorage.setItem('infrapulse_projects_cache', JSON.stringify(data));
        } else {
          // Fallback for Vercel deployment without Node API
          console.log("API not found, falling back to seed data");
          setProjects(seedProjects);
          localStorage.setItem('infrapulse_projects_cache', JSON.stringify(seedProjects));
        }
      } catch (error) {
        console.error("Failed to fetch projects from backend:", error);
        // Fallback for Vercel deployment without Node API
        setProjects(seedProjects);
        localStorage.setItem('infrapulse_projects_cache', JSON.stringify(seedProjects));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [activeUserId]); // Refetch when user switches

  return { projects, loading };
}
