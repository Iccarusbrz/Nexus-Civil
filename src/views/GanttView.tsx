import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Loader2,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project, Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  differenceInDays,
  parseISO,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface GanttViewProps {
  projects: Project[];
}

export function GanttView({ projects }: GanttViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { tasks, createTask, updateTask, deleteTask } = useTasks(selectedProjectId);
  const [viewDate, setViewDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(addDays(start, 30)); // Show ~2 months
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const getTaskStyle = (task: Task) => {
    const start = startOfDay(parseISO(task.start));
    const end = startOfDay(parseISO(task.end));
    const timelineStart = startOfDay(days[0]);
    
    const leftDays = differenceInDays(start, timelineStart);
    const durationDays = differenceInDays(end, start) + 1;
    
    const dayWidth = 40; // px
    
    return {
      left: `${leftDays * dayWidth}px`,
      width: `${durationDays * dayWidth}px`
    };
  };

  const handleAddTask = async () => {
    if (!selectedProjectId) return;
    try {
      await createTask({
        name: 'Nova Tarefa',
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        progress: 0,
        status: 'pending',
        responsible: 'Responsável'
      });
      toast.success('Nova tarefa adicionada no final do cronograma');
    } catch {
      toast.error('Erro ao adicionar tarefa');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await updateTask(id, updates);
      toast.success('Tarefa atualizada com sucesso');
    } catch {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Tarefa removida');
    } catch {
      toast.error('Erro ao remover tarefa');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Cronograma de Obra</h3>
          <p className="text-slate-500">Gestão de prazos, dependências e caminho crítico</p>
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button disabled={!selectedProjectId} onClick={handleAddTask} className="bg-orange-600">
            <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setViewDate(addDays(viewDate, -30))}>
              <ChevronLeft size={20} />
            </Button>
            <span className="font-bold text-slate-700 capitalize">
              {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setViewDate(addDays(viewDate, 30))}>
              <ChevronRight size={20} />
            </Button>
          </div>
          <div className="flex gap-4">
            <Legend color="bg-blue-500" label="Em Andamento" />
            <Legend color="bg-green-500" label="Concluída" />
            <Legend color="bg-red-500" label="Atrasada" />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-max relative">
            {/* Timeline Header */}
            <div className="flex border-b bg-slate-50/50">
              <div className="w-64 sticky left-0 bg-slate-50 z-20 border-r p-4 font-bold text-xs text-slate-500 uppercase">Tarefa</div>
              <div className="flex">
                {days.map((day, i) => (
                  <div key={i} className={`w-10 h-10 flex flex-col items-center justify-center border-r text-[10px] ${isSameDay(day, new Date()) ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-400'}`}>
                    <span>{format(day, 'EEE', { locale: ptBR })}</span>
                    <span>{format(day, 'dd')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="relative">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="flex border-b group hover:bg-slate-50/50 transition-colors">
                    <div className="w-64 sticky left-0 bg-white group-hover:bg-slate-50/50 z-20 border-r p-3 flex flex-col justify-center cursor-pointer" onClick={() => setEditingTask(task)}>
                      <p className="text-sm font-bold text-slate-700">{task.name}</p>
                      <span className="text-[10px] text-slate-400">{task.responsible}</span>
                    </div>
                    <div className="flex relative h-14 items-center">
                      {/* Grid background */}
                      {days.map((_, i) => (
                        <div key={i} className="w-10 h-full border-r border-slate-100" />
                      ))}
                      
                      {/* Task Bar */}
                      <div 
                        className={`absolute h-8 rounded-md shadow-sm flex items-center px-3 transition-all ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'delayed' ? 'bg-red-500' :
                          task.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={getTaskStyle(task)}
                      >
                        <div className="absolute inset-0 bg-white/10" />
                        <span className="text-[10px] font-bold text-white truncate">{task.progress}%</span>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -right-8 opacity-0 group-hover:opacity-100 h-6 w-6 text-slate-400 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  {selectedProjectId ? 'Nenhuma tarefa cadastrada.' : 'Selecione uma obra para ver o cronograma.'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da tarefa no cronograma.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-name">Nome da Tarefa</Label>
                <Input 
                  id="task-name" 
                  value={editingTask.name} 
                  onChange={(e) => setEditingTask({...editingTask, name: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-resp">Responsável</Label>
                <Input 
                  id="task-resp" 
                  value={editingTask.responsible} 
                  onChange={(e) => setEditingTask({...editingTask, responsible: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-start">Início</Label>
                  <Input 
                    id="task-start" 
                    type="date" 
                    value={editingTask.start} 
                    onChange={(e) => setEditingTask({...editingTask, start: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-end">Fim</Label>
                  <Input 
                    id="task-end" 
                    type="date" 
                    value={editingTask.end} 
                    onChange={(e) => setEditingTask({...editingTask, end: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-progress">Progresso (%)</Label>
                  <Input 
                    id="task-progress" 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={editingTask.progress} 
                    onChange={(e) => setEditingTask({...editingTask, progress: Number(e.target.value)})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select 
                    value={editingTask.status} 
                    onValueChange={(val: any) => setEditingTask({...editingTask, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in-progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="delayed">Atrasada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

function Legend({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}
