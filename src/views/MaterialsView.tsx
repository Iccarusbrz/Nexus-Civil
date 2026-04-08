import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Save,
  Trash2,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Project, Material } from '../types';
import { useMaterials } from '../hooks/useMaterials';
import { toast } from 'sonner';

interface MaterialsViewProps {
  projects: Project[];
}

export function MaterialsView({ projects }: MaterialsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('global');
  const { materials, createMaterial, updateMaterial, deleteMaterial } = useMaterials(selectedProjectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Calculator state
  const [calcMaterial, setCalcMaterial] = useState<string>('');
  const [calcQuantity, setCalcQuantity] = useState<number>(0);

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMaterial = async () => {
    if (!selectedProjectId || selectedProjectId === 'global') return;
    try {
      await createMaterial({
        name: 'Novo Insumo',
        unit: 'Un',
        price: 0,
        category: 'Geral',
      });
      toast.success('Insumo adicionado');
    } catch {
      toast.error('Erro ao adicionar insumo');
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    await updateMaterial(id, updates);
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteMaterial(id);
      toast.success('Insumo removido');
    } catch {
      toast.error('Erro ao remover insumo');
    }
  };

  const selectedMatForCalc = materials.find(m => m.id === calcMaterial);
  const totalCalc = selectedMatForCalc ? selectedMatForCalc.price * calcQuantity : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Insumos e Materiais</h3>
          <p className="text-slate-500">Gestão de preços, cotações e estimativas de consumo</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Filtrar por Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Insumos Globais</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedProjectId || selectedProjectId === 'global'} onClick={handleAddMaterial} className="bg-orange-600">
            <Plus className="mr-2 h-4 w-4" /> Novo Insumo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por nome ou categoria..." 
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card className="border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Insumo</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Unidade</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Preço Unit.</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map(mat => (
                    <tr key={mat.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <Input 
                          className="font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 h-auto"
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(mat.id, { name: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400">Ref: SINAPI/SICRO</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <Input 
                          className="text-sm text-slate-600 bg-transparent border-none focus:ring-0 p-0 h-auto w-12"
                          value={mat.unit}
                          onChange={(e) => handleUpdateMaterial(mat.id, { unit: e.target.value })}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-800">R$</span>
                          <Input 
                            type="number"
                            className="font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 h-auto w-20"
                            value={mat.price}
                            onChange={(e) => handleUpdateMaterial(mat.id, { price: parseFloat(e.target.value) || 0 })}
                          />
                          {mat.price > 50 ? <TrendingUp size={12} className="text-red-500" /> : <TrendingDown size={12} className="text-green-500" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <Input 
                          className="text-[10px] bg-transparent border-none focus:ring-0 p-0 h-auto w-24"
                          value={mat.category}
                          onChange={(e) => handleUpdateMaterial(mat.id, { category: e.target.value })}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleDeleteMaterial(mat.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="text-orange-600" /> Calculadora de Insumos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Material</Label>
                <Select value={calcMaterial} onValueChange={setCalcMaterial}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Escolha o insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade Necessária</Label>
                <Input 
                  type="number" 
                  value={calcQuantity} 
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Total Estimado</span>
                  <span className="text-2xl font-bold text-slate-800">R$ {totalCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <Button className="w-full bg-slate-900 hover:bg-slate-800">
                  Adicionar à Lista de Compra
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Variação de Preços (6 meses)</CardTitle>
            </CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { m: 'Nov', p: 32 }, { m: 'Dez', p: 33 }, { m: 'Jan', p: 35 }, { m: 'Fev', p: 34 }, { m: 'Mar', p: 34.5 }
                ]}>
                  <XAxis dataKey="m" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
