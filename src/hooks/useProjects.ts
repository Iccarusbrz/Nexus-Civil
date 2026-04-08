import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Project } from '../types';
import { MOCK_PROJECTS, getLocalMockData, saveLocalMockData } from '../data/mockData';

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const loadMock = () => {
      setProjects(getLocalMockData('projects', MOCK_PROJECTS));
      setLoading(false);
    };

    setLoading(true);
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Project));
      
      setProjects(data.length > 0 ? data : getLocalMockData('projects', MOCK_PROJECTS));
      setLoading(false);
    }, (error) => {
      loadMock();
    });

    return unsubscribe;
  }, [userId]);

  const createProject = async (projectData: Partial<Project>) => {
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      ...projectData,
      createdAt: serverTimestamp(),
      ownerId: userId,
    };
    try {
      await addDoc(collection(db, 'projects'), newProject);
    } catch (error) {
      setProjects(prev => {
        const next = [newProject as Project, ...prev];
        saveLocalMockData('projects', next);
        return next;
      });
    }
  };

  const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, projectData);
    } catch (error) {
      setProjects(prev => {
        const next = prev.map(p => p.id === projectId ? { ...p, ...projectData } : p);
        saveLocalMockData('projects', next);
        return next;
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (error) {
      // Local fallback para o Modo Teste
      setProjects(prev => {
        const next = prev.filter(p => p.id !== projectId);
        saveLocalMockData('projects', next);
        return next;
      });
    }
  };

  return { projects, loading, createProject, updateProject, deleteProject };
}
