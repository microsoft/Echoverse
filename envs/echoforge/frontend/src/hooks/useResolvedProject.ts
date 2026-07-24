import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Project } from '../types';

export function useResolvedProject(namespace?: string, projectPath?: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!namespace || !projectPath) {
      setProject(null);
      setLoading(false);
      setError('Missing project path.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextProject = await api.findProjectByPath(namespace, projectPath);
      if (!nextProject) {
        throw new Error('Project not found');
      }
      setProject(nextProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [namespace, projectPath]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  return { project, loading, error, refresh: loadProject };
}
