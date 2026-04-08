import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShieldCheck, 
  BrainCircuit, 
  Loader2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Project } from '../types';
import { analyzeCompliance } from '../services/geminiService';

interface DashboardViewProps {
  projects: Project[];
}

export function DashboardView({ projects }: DashboardViewProps) {
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.spent || 0), 0);
  const avgProgress = projects.length > 0 
    ? projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length 
    : 0;
  
  const criticalAlerts = projects.filter(p => p.progress < (p.spent / p.budget) * 100 - 10).length;

  const [selectedProjectForAI, setSelectedProjectForAI] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const runAnalysis = async () => {
    if (!selectedProjectForAI) return;
    setIsAiLoading(true);
    try {
      const project = projects.find(p => p.id === selectedProjectForAI);
      const result = await analyzeCompliance(project, ["NBR 9050", "NR 18"]);
      setAiResult(result);
    } catch (error: any) {
      console.error("AI Analysis failed", error);
      setAiResult({ 
        status: "error", 
        findings: [], 
        recommendations: [error.message || "Erro na análise. Verifique a configuração da chave API."] 
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Dynamic data for charts
  const projectDistribution = [
    { name: 'Prédio', value: projects.filter(p => p.type === 'predio').length },
    { name: 'Industrial', value: projects.filter(p => p.type === 'industrial').length },
    { name: 'Comercial', value: projects.filter(p => p.type === 'comercial').length },
    { name: 'Infra', value: projects.filter(p => p.type === 'infraestrutura').length },
    { name: 'Casa', value: projects.filter(p => p.type === 'casa').length },
  ].filter(d => d.value > 0);

  // Aggregate history from all projects for Curva S
  const consolidatedHistory = useMemo(() => {
    const historyMap: Record<string, { date: string; progress: number; count: number }> = {};
    
    projects.forEach(p => {
      p.history?.forEach(h => {
        if (!historyMap[h.date]) {
          historyMap[h.date] = { date: h.date, progress: 0, count: 0 };
        }
        historyMap[h.date].progress += h.progress;
        historyMap[h.date].count += 1;
      });
    });

    return Object.values(historyMap)
      .map(h => ({ date: h.date, progress: h.progress / h.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [projects]);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Orçamento Total" 
          value={`R$ ${(totalBudget / 1000000).toFixed(1)}M`} 
          icon={<DollarSign className="text-blue-600" />} 
          trend="+12% este mês" 
          trendUp={true}
        />
        <StatCard 
          title="Progresso Médio" 
          value={`${avgProgress.toFixed(1)}%`} 
          icon={<TrendingUp className="text-green-600" />} 
          trend="No prazo" 
          trendUp={true}
        />
        <StatCard 
          title="Alertas Críticos" 
          value={criticalAlerts.toString()} 
          icon={<AlertTriangle className="text-red-600" />} 
          trend="Requer atenção" 
          trendUp={false}
        />
        <StatCard 
          title="Eficiência BDI" 
          value="24.5%" 
          icon={<Activity className="text-purple-600" />} 
          trend="Otimizado" 
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Curva S - Progresso Físico vs Financeiro</CardTitle>
            <CardDescription>Consolidado de todas as obras ativas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consolidatedHistory.length > 0 ? consolidatedHistory : [
                { date: 'Jan', progress: 10 },
                { date: 'Fev', progress: 25 },
                { date: 'Mar', progress: 45 },
                { date: 'Abr', progress: 60 }
              ]}>
                <defs>
                  <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="progress" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Distribuição por Segmento</CardTitle>
            <CardDescription>Volume de obras por tipo</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {projectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gemini Compliance Section */}
      <Card className="border-orange-200 bg-orange-50/20 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <BrainCircuit className="text-orange-600" />
              Inteligência Artificial Nexus (Gemini)
            </CardTitle>
            <CardDescription>Análise avançada de compliance e conformidade técnica</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select onValueChange={setSelectedProjectForAI}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={runAnalysis} 
              disabled={!selectedProjectForAI || isAiLoading}
              className="bg-orange-600"
            >
              {isAiLoading ? <Loader2 className="animate-spin" /> : "Analisar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={
                    aiResult.status === 'compliant' ? 'bg-green-100 text-green-700' :
                    aiResult.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }>
                    Status: {aiResult.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-700">Principais Descobertas:</h4>
                  {aiResult.findings?.map((f: any, i: number) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                      <ShieldCheck className={`w-5 h-5 mt-0.5 ${f.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-500">{f.norm}</p>
                        <p className="text-sm text-slate-800">{f.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-sm text-slate-700 mb-2">Análise Técnica:</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{aiResult.analysis || "Análise detalhada gerada pelo Gemini..."}</p>
                </div>
                
                <div className="p-4 bg-white border border-orange-100 rounded-xl">
                  <h4 className="font-bold text-sm text-slate-700 mb-3">Recomendações da IA:</h4>
                  <ul className="space-y-2">
                    {aiResult.recommendations?.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              Selecione um projeto e clique em analisar para ver os resultados de conformidade técnica.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
          <Badge variant="outline" className={trendUp ? 'text-green-600' : 'text-red-600'}>
            {trend}
          </Badge>
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
