import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { MemorialSection } from '../types';
import { getLocalMockData, saveLocalMockData } from '../data/mockData';

export function useMemorials(projectId: string | undefined) {
  const [sections, setSections] = useState<MemorialSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setSections([]);
      setLoading(false);
      return;
    }

    const loadMock = () => {
      setSections(getLocalMockData(`memorials_${projectId}`, []));
      setLoading(false);
    };

    setLoading(true);
    const q = query(
      collection(db, 'projects', projectId, 'memorials'),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MemorialSection));
      
      setSections(data.length > 0 ? data : getLocalMockData(`memorials_${projectId}`, []));
      setLoading(false);
    }, (error) => {
      loadMock();
    });

    return unsubscribe;
  }, [projectId]);

  const createSection = async (sectionData: Partial<MemorialSection>) => {
    if (!projectId) return;
    const newSection = {
      id: Math.random().toString(36).substr(2, 9),
      ...sectionData,
      projectId,
    } as MemorialSection;

    try {
      await addDoc(collection(db, 'projects', projectId, 'memorials'), newSection);
    } catch (error) {
      setSections(prev => {
        const next = [...prev, newSection];
        saveLocalMockData(`memorials_${projectId}`, next);
        return next;
      });
    }
  };

  const updateSection = async (sectionId: string, sectionData: Partial<MemorialSection>) => {
    if (!projectId) return;
    try {
      const sectionRef = doc(db, 'projects', projectId, 'memorials', sectionId);
      await updateDoc(sectionRef, sectionData);
    } catch (error) {
      setSections(prev => {
        const next = prev.map(s => s.id === sectionId ? { ...s, ...sectionData } : s);
        saveLocalMockData(`memorials_${projectId}`, next);
        return next;
      });
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!projectId) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'memorials', sectionId));
    } catch (error) {
      setSections(prev => {
        const next = prev.filter(s => s.id !== sectionId);
        saveLocalMockData(`memorials_${projectId}`, next);
        return next;
      });
    }
  };

  return { sections, loading, createSection, updateSection, deleteSection };
}
