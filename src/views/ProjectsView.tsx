import { useState } from 'react';
import { 
  Plus, 
  Building2, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  Calendar,
  Layers,
  FileImage,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from 'sonner';
import { Project, ProjectType } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  onCreate: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTabChange: (tab: string) => void;
}

export function ProjectsView({ projects, onCreate, onUpdate, onDelete, onTabChange }: ProjectsViewProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [blueprintProject, setBlueprintProject] = useState<Project | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as ProjectType,
      budget: Number(formData.get('budget')),
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      status: 'planning',
      progress: 0,
      spent: 0,
      bimCompliance: true
    };

    try {
      if (editingProject) {
        await onUpdate(editingProject.id, data);
        setEditingProject(null);
        toast.success('Projeto atualizado!');
      } else {
        await onCreate(data);
        setIsNewProjectOpen(false);
        toast.success('Projeto criado!');
      }
    } catch {
      toast.error('Erro ao salvar projeto');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Meus Projetos</h3>
          <p className="text-slate-500">Gerencie seu portfólio de obras e conformidade BIM</p>
        </div>
        <Dialog open={isNewProjectOpen || !!editingProject} onOpenChange={(open) => {
          if (!open) {
            setIsNewProjectOpen(false);
            setEditingProject(null);
          }
        }}>
          <DialogTrigger render={
            <Button onClick={() => setIsNewProjectOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" /> Novo Projeto
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProject ? 'Editar Projeto' : 'Cadastrar Novo Projeto'}</DialogTitle>
                <DialogDescription>
                  Preencha as informações básicas para iniciar a gestão técnica da obra.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Obra</Label>
                  <Input id="name" name="name" defaultValue={editingProject?.name} placeholder="Ex: Residencial Aurora" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" defaultValue={editingProject?.type || 'predio'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="predio">Edifício Residencial</SelectItem>
                        <SelectItem value="casa">Casa Unifamiliar</SelectItem>
                        <SelectItem value="comercial">Centro Comercial</SelectItem>
                        <SelectItem value="industrial">Galpão Industrial</SelectItem>
                        <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Orçamento Estimado (R$)</Label>
                    <Input id="budget" name="budget" type="number" defaultValue={editingProject?.budget} placeholder="0.00" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input id="location" name="location" defaultValue={editingProject?.location} placeholder="Cidade, UF" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição Curta</Label>
                  <Input id="description" name="description" defaultValue={editingProject?.description} placeholder="Breve resumo do projeto" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-orange-600">
                  {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow flex flex-col">
            <div className={`h-2 ${
              project.type === 'predio' ? 'bg-blue-500' : 
              project.type === 'casa' ? 'bg-green-500' : 
              project.type === 'comercial' ? 'bg-orange-500' : 
              project.type === 'industrial' ? 'bg-purple-500' : 'bg-slate-500'
            }`} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="mb-2 capitalize">{project.type}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => setEditingProject(project)}>
                    <Edit size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-600" 
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja apagar o projeto "${project.name}"? Essa ação não pode ser desfeita.`)) {
                        setIsDeleting(project.id);
                        try {
                          await onDelete(project.id);
                          toast.success('Projeto removido');
                        } catch {
                          toast.error('Erro ao remover projeto');
                        } finally {
                          setIsDeleting(null);
                        }
                      }
                    }}
                    disabled={isDeleting === project.id}
                  >
                    {isDeleting === project.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl text-slate-800">{project.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin size={14} /> {project.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progresso Físico</span>
                  <span className="font-bold text-slate-700">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Orçamento</p>
                  <p className="text-sm font-bold text-slate-700">R$ {(project.budget / 1000).toFixed(0)}k</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status BIM</p>
                  <div className="flex items-center gap-1 text-green-600">
                    <ShieldCheck size={14} />
                    <span className="text-xs font-bold">LOD 350</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => onTabChange('gantt')}>
                <Calendar className="mr-2 h-3 w-3" /> Cronograma
              </Button>
              <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => setBlueprintProject(project)}>
                <FileImage className="mr-2 h-3 w-3" /> Plantas
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Blueprints Dialog */}
      <Dialog open={!!blueprintProject} onOpenChange={(open) => !open && setBlueprintProject(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestão de Plantas - {blueprintProject?.name}</DialogTitle>
            <DialogDescription>
              Adicione as plantas do projeto para análise técnica via IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input placeholder="Nome da Planta (ex: Planta Baixa Térreo)" id="new-blueprint-name" />
              <label className="bg-slate-100 px-4 py-2 rounded-md cursor-pointer hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium">
                <Plus size={16} /> Arquivo
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const nameInput = document.getElementById('new-blueprint-name') as HTMLInputElement;
                  if (file && blueprintProject) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const newBlueprint = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: nameInput.value || file.name,
                        url: ev.target?.result as string
                      };
                      const updatedBlueprints = [...(blueprintProject.blueprints || []), newBlueprint];
                      await onUpdate(blueprintProject.id, { blueprints: updatedBlueprints });
                      setBlueprintProject({ ...blueprintProject, blueprints: updatedBlueprints });
                      nameInput.value = '';
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {blueprintProject?.blueprints?.map((bp) => (
                <Card key={bp.id} className="p-3 border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                        <FileImage size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{bp.name}</p>
                        <p className="text-[10px] text-slate-400">Análise: {bp.analysis ? 'Concluída' : 'Pendente'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] h-8"
                        onClick={async () => {
                          setIsAnalyzing(bp.id);
                          // Simulate AI analysis
                          setTimeout(async () => {
                            const analysis = "Planta em conformidade com a NBR 9050. Dimensões de portas e circulações adequadas para acessibilidade. Sugestão: revisar posicionamento de shafts hidráulicos.";
                            const updatedBlueprints = blueprintProject.blueprints?.map(b => 
                              b.id === bp.id ? { ...b, analysis } : b
                            );
                            await onUpdate(blueprintProject.id, { blueprints: updatedBlueprints });
                            setBlueprintProject({ ...blueprintProject, blueprints: updatedBlueprints });
                            setIsAnalyzing(null);
                          }, 2000);
                        }}
                        disabled={isAnalyzing === bp.id}
                      >
                        {isAnalyzing === bp.id ? <Loader2 className="animate-spin mr-1" size={12} /> : <Brain size={12} className="mr-1" />}
                        Analisar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={async () => {
                          const updatedBlueprints = blueprintProject.blueprints?.filter(b => b.id !== bp.id);
                          await onUpdate(blueprintProject.id, { blueprints: updatedBlueprints });
                          setBlueprintProject({ ...blueprintProject, blueprints: updatedBlueprints });
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {bp.analysis && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-100 rounded text-[10px] text-slate-600 leading-relaxed">
                      <p className="font-bold text-orange-700 mb-1 flex items-center gap-1">
                        <ShieldCheck size={10} /> Resultado da Análise Técnica:
                      </p>
                      {bp.analysis}
                    </div>
                  )}
                </Card>
              ))}
              {(!blueprintProject?.blueprints || blueprintProject.blueprints.length === 0) && (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
                  Nenhuma planta adicionada ainda.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setBlueprintProject(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
