import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../context/SessionContext';
import { getWebServerUrl } from '../utils/network';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const session = useSession();
  const activeUserId = session?.activeUser?.id || 'user_nodal_1';

  const fetchProjects = useCallback(async () => {
    // 1. Try to load from AsyncStorage instantly (Memory Behavior / Offline Fallback)
    try {
      const cached = await AsyncStorage.getItem('@infrapulse_projects_cache');
      if (cached) {
        setProjects(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {
      console.log('Failed to read cache:', e);
    }

    // 2. Fetch fresh data from backend with user segregation
    try {
      const url = `${getWebServerUrl()}/api/projects`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(url, { 
        headers: {
          'x-user-id': activeUserId
        },
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      setProjects(prevProjects => {
        if (JSON.stringify(prevProjects) === JSON.stringify(data)) {
          return prevProjects;
        }
        return data;
      });
      
      // Update local cache
      await AsyncStorage.setItem('@infrapulse_projects_cache', JSON.stringify(data));
      setError(null);
    } catch (err) {
      console.log('Sync timeout or network error in useProjects:', err);
      // Only set error if we don't have cached projects
      setProjects(prevProjects => {
        if (prevProjects.length === 0) {
          setError(err.message);
        }
        return prevProjects;
      });
    } finally {
      setLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchProjects();
    const syncInterval = setInterval(fetchProjects, 10000);
    return () => clearInterval(syncInterval);
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
};
