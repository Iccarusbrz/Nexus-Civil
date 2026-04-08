import { useState, useEffect } from 'react';
import { 
  Plus, 
  GripVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Trash2,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Project, Task } from '../types';
import { toast } from 'sonner';
import { getLocalMockData, saveLocalMockData } from '../data/mockData';

interface LeanViewProps {
  projects: Project[];
}

export function LeanView({ projects }: LeanViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!selectedProjectId) return;

    const q = query(collection(db, 'tasks'), where('projectId', '==', selectedProjectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(data.length > 0 ? data : getLocalMockData(`lean_${selectedProjectId}`, []));
    }, (error) => {
      setTasks(getLocalMockData(`lean_${selectedProjectId}`, []));
    });

    return unsubscribe;
  }, [selectedProjectId]);

  const columns = [
    { id: 'pending', title: 'A Fazer', color: 'bg-slate-200', icon: <Clock size={16} /> },
    { id: 'in-progress', title: 'Em Execução', color: 'bg-blue-500', icon: <ActivityIcon /> },
    { id: 'completed', title: 'Concluído', color: 'bg-green-500', icon: <CheckCircle2 size={16} /> },
    { id: 'delayed', title: 'Impedido / Atrasado', color: 'bg-red-500', icon: <AlertCircle size={16} /> }
  ];

  const handleAddTask = async (status: string) => {
    if (!selectedProjectId) return;
    try {
      const newTask = {
        projectId: selectedProjectId,
        name: 'Nova Tarefa Lean',
        status,
        progress: 0,
        responsible: 'A definir',
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'tasks'), newTask);
      toast.success('Tarefa adicionada!');
    } catch (error) {
      setTasks(prev => {
        const next = [...prev, { id: Math.random().toString(36).substr(2, 9), ...{
          projectId: selectedProjectId,
          name: 'Nova Tarefa Lean',
          status,
          progress: 0,
          responsible: 'A definir',
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        } } as Task];
        saveLocalMockData(`lean_${selectedProjectId}`, next);
        return next;
      });
      toast.success('Tarefa adicionada!');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { status });
    } catch (error) {
      setTasks(prev => {
        const next = prev.map(t => t.id === id ? { ...t, status: status as Task['status'] } : t);
        saveLocalMockData(`lean_${selectedProjectId}`, next);
        return next;
      });
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'tasks', id), updates);
      toast.success('Tarefa editada com sucesso');
    } catch (error) {
      setTasks(prev => {
        const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
        saveLocalMockData(`lean_${selectedProjectId}`, next);
        return next;
      });
      toast.success('Tarefa editada com sucesso');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Tarefa removida');
    } catch (error) {
      setTasks(prev => {
        const next = prev.filter(t => t.id !== id);
        saveLocalMockData(`lean_${selectedProjectId}`, next);
        return next;
      });
      toast.success('Tarefa removida');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Canteiro Lean</h3>
          <p className="text-slate-500">Gestão visual de tarefas e produtividade de campo</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Selecione a Obra" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">Linha de Balanço</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col gap-4 bg-slate-100/50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{col.title}</h4>
                <Badge variant="secondary" className="ml-2">{tasks.filter(t => t.status === col.id).length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => handleAddTask(col.id)}>
                <Plus size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card key={task.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setEditingTask(task)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-slate-800 leading-tight">{task.name}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User size={12} />
                      <span>{task.responsible}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Badge variant="outline" className="text-[10px]">{task.end}</Badge>
                      <div className="flex gap-1">
                        {columns.filter(c => c.id !== task.status).map(c => (
                          <button 
                            key={c.id}
                            className={`w-4 h-4 rounded-full ${c.color} opacity-30 hover:opacity-100 transition-opacity`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(task.id, c.id);
                            }}
                            title={`Mover para ${c.title}`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tarefa Lean</DialogTitle>
            <DialogDescription>
              Atualize as informações da tarefa de campo.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lean-task-name">Descrição da Tarefa</Label>
                <Input 
                  id="lean-task-name" 
                  value={editingTask.name} 
                  onChange={(e) => setEditingTask({...editingTask, name: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lean-task-resp">Responsável / Equipe</Label>
                <Input 
                  id="lean-task-resp" 
                  value={editingTask.responsible} 
                  onChange={(e) => setEditingTask({...editingTask, responsible: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lean-task-end">Data Limite</Label>
                <Input 
                  id="lean-task-end" 
                  type="date"
                  value={editingTask.end} 
                  onChange={(e) => setEditingTask({...editingTask, end: e.target.value})} 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancelar</Button>
            <Button 
              className="bg-orange-600" 
              onClick={() => {
                if (editingTask) {
                  handleUpdateTask(editingTask.id, editingTask);
                  setEditingTask(null);
                }
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
