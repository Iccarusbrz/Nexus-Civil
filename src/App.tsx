import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useProjects } from './hooks/useProjects';
import { Layout } from './components/Layout';
import { DashboardView } from './views/DashboardView';
import { ProjectsView } from './views/ProjectsView';
import { DiaryView } from './views/DiaryView';
import { LeanView } from './views/LeanView';
import { GanttView } from './views/GanttView';
import { BDIView } from './views/BDIView';
import { MaterialsView } from './views/MaterialsView';
import { MemorialView } from './views/MemorialView';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { 
  Plus, 
  GripVertical, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Trash2,
  User,
  Construction,
  HardHat,
  Building2,
  CheckSquare
} from 'lucide-react';

function App() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects(user?.uid);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
        <p className="text-slate-400 animate-pulse">Carregando Nexus Civil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-md w-full p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20 mb-6 rotate-3">
              <Construction className="text-white w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Nexus Civil</h1>
            <p className="text-slate-400">Plataforma Inteligente para Gestão de Obras e Compliance BIM</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => signIn()} 
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </Button>
            <Button 
              onClick={() => signIn(true)} 
              variant="outline"
              className="w-full h-12 text-slate-400 border-slate-600 hover:bg-slate-700 hover:text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              Acessar como Convidado (Modo Teste)
            </Button>
            <p className="text-[10px] text-slate-500 text-center px-4">
              Ao entrar, você concorda com nossos termos de serviço e políticas de privacidade técnica.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            <FeatureIcon icon={<HardHat size={16} />} label="Segurança" />
            <FeatureIcon icon={<Building2 size={16} />} label="Projetos" />
            <FeatureIcon icon={<CheckSquare size={16} />} label="Lean" />
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView projects={projects} />;
      case 'projects':
        return (
          <ProjectsView 
            projects={projects} 
            onCreate={createProject} 
            onUpdate={updateProject} 
            onDelete={deleteProject}
            onTabChange={setActiveTab}
          />
        );
      case 'diary':
        return <DiaryView projects={projects} />;
      case 'lean':
        return <LeanView projects={projects} />;
      case 'gantt':
        return <GanttView projects={projects} />;
      case 'bdi':
        return <BDIView projects={projects} />;
      case 'materials':
        return <MaterialsView projects={projects} />;
      case 'memorial':
        return <MemorialView projects={projects} />;
      default:
        return <DashboardView projects={projects} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {projectsLoading ? (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-orange-500 mb-2" />
          <p className="text-slate-400 text-sm">Sincronizando dados...</p>
        </div>
      ) : (
        renderView()
      )}
      <Toaster />
    </Layout>
  );
}

function FeatureIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default App;
