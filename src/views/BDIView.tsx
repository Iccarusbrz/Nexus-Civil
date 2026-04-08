import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Save, 
  Download, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  Loader2
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
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { Project, BDIConfig } from '../types';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { getLocalMockData, saveLocalMockData } from '../data/mockData';

interface BDIViewProps {
  projects: Project[];
}

export function BDIView({ projects }: BDIViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [config, setConfig] = useState<BDIConfig>({
    id: '',
    projectId: '',
    administration: 4.0,
    insurance: 0.8,
    risk: 1.2,
    financial: 1.2,
    profit: 7.0,
    taxes: {
      pis: 0.65,
      cofins: 3.0,
      iss: 5.0,
      cprb: 4.5
    },
    totalBDI: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) return;

    const q = query(collection(db, 'projects', selectedProjectId, 'bdi'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as BDIConfig;
        setConfig({ ...data, id: snapshot.docs[0].id });
      } else {
        // Try loading from localStorage
        const saved = getLocalMockData(`bdi_${selectedProjectId}`, []);
        if (saved.length > 0) {
          setConfig(saved[0] as any);
        } else {
          setConfig(prev => ({ ...prev, projectId: selectedProjectId, id: '' }));
        }
      }
    }, (error) => {
      const saved = getLocalMockData(`bdi_${selectedProjectId}`, []);
      if (saved.length > 0) {
        setConfig(saved[0] as any);
      } else {
        setConfig(prev => ({ ...prev, projectId: selectedProjectId, id: '' }));
      }
    });

    return unsubscribe;
  }, [selectedProjectId]);

  const calculateBDI = () => {
    const { administration, insurance, risk, financial, profit, taxes } = config;
    const i = (administration + insurance + risk) / 100;
    const f = financial / 100;
    const l = profit / 100;
    const t = (taxes.pis + taxes.cofins + taxes.iss + taxes.cprb) / 100;

    // Formula TCU: BDI = { [ (1 + AC + S + R + G) * (1 + DF) * (1 + L) ] / (1 - I) } - 1
    const result = (((1 + i) * (1 + f) * (1 + l)) / (1 - t)) - 1;
    return (result * 100).toFixed(2);
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setIsSaving(true);
    const bdiValue = parseFloat(calculateBDI());
    const docId = config.id || 'default_config';
    try {
      await setDoc(doc(db, 'projects', selectedProjectId, 'bdi', docId), {
        ...config,
        projectId: selectedProjectId,
        totalBDI: bdiValue
      });
      setConfig(prev => ({ ...prev, id: docId }));
      toast.success('BDI salvo com sucesso!');
    } catch (error) {
      // Fallback local
      const bdiData = { ...config, projectId: selectedProjectId, totalBDI: bdiValue, id: docId };
      saveLocalMockData(`bdi_${selectedProjectId}`, [bdiData]);
      setConfig(prev => ({ ...prev, id: docId }));
      toast.success('BDI salvo localmente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportReport = () => {
    if (!selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Memória de Cálculo BDI", 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(project?.name || "", 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("Parâmetros Utilizados:", 20, 50);
    
    const data = [
      ["Administração Central", `${config.administration}%`],
      ["Seguro e Garantia", `${config.insurance}%`],
      ["Risco", `${config.risk}%`],
      ["Despesas Financeiras", `${config.financial}%`],
      ["Lucro", `${config.profit}%`],
      ["PIS", `${config.taxes.pis}%`],
      ["COFINS", `${config.taxes.cofins}%`],
      ["ISS", `${config.taxes.iss}%`],
      ["CPRB", `${config.taxes.cprb}%`],
    ];
    
    let y = 60;
    data.forEach(([label, value]) => {
      doc.text(label, 20, y);
      doc.text(value, 150, y);
      y += 8;
    });
    
    doc.setLineWidth(0.5);
    doc.line(20, y + 5, 190, y + 5);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BDI TOTAL CALCULADO:", 20, y + 15);
    doc.text(`${calculateBDI()}%`, 150, y + 15);
    
    doc.save(`BDI_${project?.name.replace(/\s+/g, '_')}.pdf`);
  };

  const updateField = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BDIConfig] as any),
          [child]: numValue
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [field]: numValue }));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Calculadora BDI</h3>
          <p className="text-slate-500">Cálculo de Benefícios e Despesas Indiretas conforme acórdãos do TCU</p>
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
          <Button onClick={handleSave} disabled={!selectedProjectId || isSaving} className="bg-orange-600">
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configuração
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros de Custos Indiretos</CardTitle>
              <CardDescription>Valores em percentual (%)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Administração Central (AC)</Label>
                  <Input type="number" step="0.01" value={config.administration} onChange={(e) => updateField('administration', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Seguro (S) e Garantia (G)</Label>
                  <Input type="number" step="0.01" value={config.insurance} onChange={(e) => updateField('insurance', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Risco (R)</Label>
                  <Input type="number" step="0.01" value={config.risk} onChange={(e) => updateField('risk', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Despesas Financeiras (DF)</Label>
                  <Input type="number" step="0.01" value={config.financial} onChange={(e) => updateField('financial', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Lucro (L)</Label>
                  <Input type="number" step="0.01" value={config.profit} onChange={(e) => updateField('profit', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Tributos (I)</CardTitle>
              <CardDescription>Impostos incidentes sobre o faturamento</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>PIS</Label>
                  <Input type="number" step="0.01" value={config.taxes.pis} onChange={(e) => updateField('taxes.pis', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>COFINS</Label>
                  <Input type="number" step="0.01" value={config.taxes.cofins} onChange={(e) => updateField('taxes.cofins', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>ISS</Label>
                  <Input type="number" step="0.01" value={config.taxes.iss} onChange={(e) => updateField('taxes.iss', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>CPRB (Desoneração)</Label>
                  <Input type="number" step="0.01" value={config.taxes.cprb} onChange={(e) => updateField('taxes.cprb', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-orange-500 flex items-center gap-2">
                <Calculator size={20} /> Resultado BDI
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-5xl font-bold mb-2">{calculateBDI()}%</p>
              <p className="text-slate-400 text-sm mb-4">Taxa de BDI Calculada</p>
              {(() => {
                const bdi = parseFloat(calculateBDI());
                const isOutOfRange = bdi < 20.34 || bdi > 25.00;
                return isOutOfRange ? (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Fora da Faixa Recomendada (20.34% - 25.00%)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-500/20 text-green-500 border-none">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Dentro da Faixa Recomendada
                  </Badge>
                );
              })()}
            </CardContent>
            <div className="p-6 border-t border-slate-800 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Indiretos (AC+S+R)</span>
                <span className="font-bold">{(config.administration + config.insurance + config.risk).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Impostos (I)</span>
                <span className="font-bold">{(config.taxes.pis + config.taxes.cofins + config.taxes.iss + config.taxes.cprb).toFixed(2)}%</span>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-4" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" /> Gerar Memória de Cálculo
              </Button>
            </div>
          </Card>

          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <Info size={16} /> Referência TCU
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-600 space-y-2">
              <p>Acórdão 2622/2013 - Plenário</p>
              <p>Limites recomendados para construção de edifícios:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>AC: 3,00% a 5,50%</li>
                <li>S+G: 0,80% a 1,00%</li>
                <li>R: 0,97% a 1,27%</li>
                <li>DF: 0,59% a 1,39%</li>
                <li>L: 6,12% a 13,40%</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
