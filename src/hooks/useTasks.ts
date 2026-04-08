import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Task } from '../types';
import { MOCK_GANTT_TASKS, getLocalMockData, saveLocalMockData } from '../data/mockData';

export function useTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'projects', projectId, 'gantt_tasks'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Task));
      
      setTasks(data.length > 0 ? data : getLocalMockData('tasks', MOCK_GANTT_TASKS));
      setLoading(false);
    }, (error) => {
      setTasks(getLocalMockData('tasks', MOCK_GANTT_TASKS));
      setLoading(false);
    });

    return unsubscribe;
  }, [projectId]);

  const createTask = async (taskData: Partial<Task>) => {
    if (!projectId) return;
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      ...taskData,
      projectId,
      createdAt: serverTimestamp(),
    } as Task;

    try {
      await addDoc(collection(db, 'projects', projectId, 'gantt_tasks'), newTask);
    } catch (error) {
      setTasks(prev => {
        const next = [...prev, newTask];
        saveLocalMockData('tasks', next);
        return next;
      });
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    if (!projectId) return;
    try {
      const taskRef = doc(db, 'projects', projectId, 'gantt_tasks', taskId);
      await updateDoc(taskRef, taskData);
    } catch (error) {
      setTasks(prev => {
        const next = prev.map(t => t.id === taskId ? { ...t, ...taskData } : t);
        saveLocalMockData('tasks', next);
        return next;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!projectId) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'gantt_tasks', taskId));
    } catch (error) {
      setTasks(prev => {
        const next = prev.filter(t => t.id !== taskId);
        saveLocalMockData('tasks', next);
        return next;
      });
    }
  };

  return { tasks, loading, createTask, updateTask, deleteTask };
}
