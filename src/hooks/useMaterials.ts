import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Material } from '../types';
import { MOCK_MATERIALS, getLocalMockData, saveLocalMockData } from '../data/mockData';

export function useMaterials(projectId: string | undefined) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine the root collection path based on if there is a selected project.
    // If there isn't a selected project, or if we want globals, we can use a global 'materials' or ignore.
    // But since the requirement says "com vínculo por obra", we only load if a project is selected.
    if (!projectId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    
    if (projectId === 'global') {
      setMaterials(getLocalMockData('materials', MOCK_MATERIALS));
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'projects', projectId, 'materials'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Material));
      
      setMaterials(data.length > 0 ? data : getLocalMockData('materials', MOCK_MATERIALS));
      setLoading(false);
    }, (error) => {
      // Offline/Error local fallback
      setMaterials(getLocalMockData('materials', MOCK_MATERIALS));
      setLoading(false);
    });

    return unsubscribe;
  }, [projectId]);

  const createMaterial = async (materialData: Partial<Material>) => {
    if (!projectId || projectId === 'global') return;
    const newMat = {
      id: Math.random().toString(36).substr(2, 9),
      ...materialData,
      projectId,
      createdAt: serverTimestamp(),
    } as Material;

    try {
      await addDoc(collection(db, 'projects', projectId, 'materials'), newMat);
    } catch (error) {
      setMaterials(prev => {
        const next = [...prev, newMat];
        saveLocalMockData('materials', next);
        return next;
      });
    }
  };

  const updateMaterial = async (materialId: string, materialData: Partial<Material>) => {
    if (!projectId || projectId === 'global') return;
    try {
      const materialRef = doc(db, 'projects', projectId, 'materials', materialId);
      await updateDoc(materialRef, materialData);
    } catch (error) {
      setMaterials(prev => {
        const next = prev.map(m => m.id === materialId ? { ...m, ...materialData } : m);
        saveLocalMockData('materials', next);
        return next;
      });
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!projectId || projectId === 'global') return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'materials', materialId));
    } catch (error) {
      setMaterials(prev => {
        const next = prev.filter(m => m.id !== materialId);
        saveLocalMockData('materials', next);
        return next;
      });
    }
  };

  return { materials, loading, createMaterial, updateMaterial, deleteMaterial };
}
