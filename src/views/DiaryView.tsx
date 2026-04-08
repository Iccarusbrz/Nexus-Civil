import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Cloud, 
  Sun, 
  CloudRain, 
  Users, 
  Truck, 
  Save, 
  Download,
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  Camera,
  X,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../AuthContext';
import { Project, DiaryEntry } from '../types';
import { getLocalMockData, saveLocalMockData } from '../data/mockData';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface DiaryViewProps {
  projects: Project[];
}

export function DiaryView({ projects }: DiaryViewProps) {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [weatherMorning, setWeatherMorning] = useState<'sunny' | 'cloudy' | 'rainy'>('sunny');
  const [weatherAfternoon, setWeatherAfternoon] = useState<'sunny' | 'cloudy' | 'rainy'>('sunny');
  const [activities, setActivities] = useState('');
  const [occurrences, setOccurrences] = useState('');
  const [observations, setObservations] = useState('');
  const [manpower, setManpower] = useState<{ role: string; count: number }[]>([]);
  const [equipment, setEquipment] = useState<{ name: string; status: 'active' | 'idle' | 'maintenance' }[]>([]);
  const [photosFiles, setPhotosFiles] = useState<{file: File, preview: string}[]>([]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const q = query(
      collection(db, 'diary_entries'), 
      where('projectId', '==', selectedProjectId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiaryEntry));
      setEntries(data.length > 0 ? data : getLocalMockData(`diary_${selectedProjectId}`, []));
    }, (error) => {
      // Offline fallback
      setEntries(getLocalMockData(`diary_${selectedProjectId}`, []));
    });

    return unsubscribe;
  }, [selectedProjectId]);

  const handleSaveEntry = async () => {
    if (!selectedProjectId || !user) return;
    setIsLoading(true);
    try {
      // Convert photos to base64 for local storage (skip Firebase Storage upload in offline)
      let photoData: string[] = [];
      if (photosFiles.length > 0) {
        photoData = await Promise.all(photosFiles.map(item => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(item.file);
          });
        }));
      }

      const newEntry: DiaryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: selectedProjectId,
        date: format(new Date(), 'yyyy-MM-dd'),
        weather: {
          morning: weatherMorning,
          afternoon: weatherAfternoon
        },
        manpower,
        equipment,
        activities,
        occurrences,
        observations,
        photos: photoData,
        isLocked: false,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Convidado',
        createdAt: new Date().toISOString() as any
      };

      try {
        // Try Firebase first
        let uploadedPhotoUrls: string[] = [];
        if (photosFiles.length > 0) {
          uploadedPhotoUrls = await Promise.all(photosFiles.map(async (item) => {
            const fileRef = ref(storage, `diary_photos/${selectedProjectId}/${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
            await uploadBytes(fileRef, item.file);
            return await getDownloadURL(fileRef);
          }));
        }
        const firestoreEntry = { ...newEntry, photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : photoData };
        delete (firestoreEntry as any).id;
        await addDoc(collection(db, 'diary_entries'), firestoreEntry);
      } catch (fbError) {
        // Fallback: save locally
        setEntries(prev => {
          const next = [newEntry, ...prev];
          saveLocalMockData(`diary_${selectedProjectId}`, next);
          return next;
        });
      }

      setIsNewEntryOpen(false);
      resetForm();
      toast.success('Diário de Obra registrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar Diário de Obra');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setActivities('');
    setOccurrences('');
    setObservations('');
    setWeatherMorning('sunny');
    setWeatherAfternoon('sunny');
    setManpower([]);
    setEquipment([]);
    setPhotosFiles([]);
  };

  const handleExportPDF = async (entry: DiaryEntry) => {
    const doc = new jsPDF();
    const project = projects.find(p => p.id === entry.projectId);

    doc.setFontSize(20);
    doc.text("Diário de Obra", 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(project?.name || "", 105, 30, { align: 'center' });
    doc.text(`Data: ${format(new Date(entry.date + 'T12:00:00'), 'dd/MM/yyyy')}`, 105, 38, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Responsável: ${entry.authorName}`, 20, 50);
    doc.text(`Clima: Manhã (${entry.weather.morning}), Tarde (${entry.weather.afternoon})`, 20, 58);

    doc.setFont("helvetica", "bold");
    doc.text("Atividades:", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(entry.activities, 170), 20, 78);

    let y = 100;
    if (entry.occurrences) {
      doc.setFont("helvetica", "bold");
      doc.text("Ocorrências:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(entry.occurrences, 170), 20, y + 8);
      y += 30;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Efetivo (Mão de Obra):", 20, y);
    
    const tableData = entry.manpower.map(m => [m.role, m.count]);
    autoTable(doc, {
      startY: y + 5,
      head: [['Função/Cargo', 'Quantidade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    });

    // Handle Photos
    if (entry.photos && entry.photos.length > 0) {
      doc.addPage();
      doc.text("Registro Fotográfico:", 20, 20);
      let imgX = 20;
      let imgY = 30;
      
      for (let i = 0; i < entry.photos.length; i++) {
        // Just a safe fallback text if image blocks CORS directly. 
        // Real base64 translation in browser might require canvas drawing.
        // For standard blobs, jsPDF supports addImage natively.
        try {
          // If the photo is a raw base64 or valid URL that resolves via canvas
          doc.addImage(entry.photos[i], 'JPEG', imgX, imgY, 80, 80);
          imgX += 90;
          if (imgX > 150) {
            imgX = 20;
            imgY += 90;
          }
          if (imgY > 250 && i < entry.photos.length - 1) {
            doc.addPage();
            imgX = 20;
            imgY = 20;
          }
        } catch (e) {
          doc.text(`[Imagem ${i+1} não pôde ser renderizada no PDF]`, imgX, imgY+40);
        }
      }
    }

    doc.save(`Diario_${entry.date}_${project?.name.replace(/\s+/g, '_')}.pdf`);
  };

  const isEntryLocked = (entry: DiaryEntry) => {
    if (entry.isLocked) return true;
    if (!entry.createdAt) return false;
    
    // Check if more than 48 hours have passed since creation
    const createdDate = (entry.createdAt as any).toDate ? (entry.createdAt as any).toDate() : new Date(entry.createdAt as any);
    return differenceInHours(new Date(), createdDate) > 48;
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diary_entries', id));
      toast.success('Diário removido');
    } catch (error) {
      // local fallback
      setEntries(prev => {
        const next = prev.filter(e => e.id !== id);
        saveLocalMockData(`diary_${selectedProjectId}`, next);
        return next;
      });
      toast.success('Diário removido');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Diário de Obra</h3>
          <p className="text-slate-500">Registro diário de atividades, clima e ocorrências (NBR 12722)</p>
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
          <Button 
            disabled={!selectedProjectId} 
            onClick={() => setIsNewEntryOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      {isNewEntryOpen ? (
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-orange-50/50">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="text-orange-600" />
              Novo Registro - {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-slate-700 font-bold">Condições Climáticas</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Manhã</Label>
                    <div className="flex gap-2">
                      <WeatherToggle value="sunny" active={weatherMorning === 'sunny'} onClick={() => setWeatherMorning('sunny')} icon={<Sun size={16} />} />
                      <WeatherToggle value="cloudy" active={weatherMorning === 'cloudy'} onClick={() => setWeatherMorning('cloudy')} icon={<Cloud size={16} />} />
                      <WeatherToggle value="rainy" active={weatherMorning === 'rainy'} onClick={() => setWeatherMorning('rainy')} icon={<CloudRain size={16} />} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500">Tarde</Label>
                    <div className="flex gap-2">
                      <WeatherToggle value="sunny" active={weatherAfternoon === 'sunny'} onClick={() => setWeatherAfternoon('sunny')} icon={<Sun size={16} />} />
                      <WeatherToggle value="cloudy" active={weatherAfternoon === 'cloudy'} onClick={() => setWeatherAfternoon('cloudy')} icon={<Cloud size={16} />} />
                      <WeatherToggle value="rainy" active={weatherAfternoon === 'rainy'} onClick={() => setWeatherAfternoon('rainy')} icon={<CloudRain size={16} />} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Atividades Realizadas</Label>
                  <Textarea 
                    placeholder="Descreva as frentes de serviço ativas hoje..." 
                    className="min-h-[120px]"
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Ocorrências / Acidentes</Label>
                  <Textarea 
                    placeholder="Registre atrasos, falta de materiais ou acidentes..." 
                    className="min-h-[80px] border-red-100 focus:border-red-300"
                    value={occurrences}
                    onChange={(e) => setOccurrences(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Observações Técnicas</Label>
                  <Textarea 
                    placeholder="Notas adicionais, visitas técnicas ou fiscalização..." 
                    className="min-h-[80px]"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 font-bold">Efetivo (Mão de Obra)</Label>
                    <Button variant="outline" size="sm" onClick={() => setManpower([...manpower, { role: '', count: 1 }])}>
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {manpower.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Cargo/Função" value={m.role} onChange={(e) => {
                          const newM = [...manpower];
                          newM[i].role = e.target.value;
                          setManpower(newM);
                        }} />
                        <Input type="number" className="w-20" value={m.count} onChange={(e) => {
                          const newM = [...manpower];
                          newM[i].count = Number(e.target.value);
                          setManpower(newM);
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => setManpower(manpower.filter((_, idx) => idx !== i))}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 font-bold">Equipamentos</Label>
                    <Button variant="outline" size="sm" onClick={() => setEquipment([...equipment, { name: '', status: 'active' }])}>
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {equipment.map((e, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Nome do Equipamento" value={e.name} onChange={(val) => {
                          const newE = [...equipment];
                          newE[i].name = val.target.value;
                          setEquipment(newE);
                        }} />
                        <Select value={e.status} onValueChange={(val: any) => {
                          const newE = [...equipment];
                          newE[i].status = val;
                          setEquipment(newE);
                        }}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="idle">Parado</SelectItem>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => setEquipment(equipment.filter((_, idx) => idx !== i))}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-slate-700 font-bold">Fotos da Obra</Label>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {photosFiles.map((item, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={item.preview} className="w-24 h-24 object-cover rounded-lg border" />
                        <button 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          onClick={() => {
                            URL.revokeObjectURL(item.preview);
                            setPhotosFiles(photosFiles.filter((_, idx) => idx !== i));
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                      <Camera size={24} />
                      <span className="text-[10px] mt-1">Upload</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotosFiles([...photosFiles, { file, preview: URL.createObjectURL(file) }]);
                        }
                      }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-6 border-t flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsNewEntryOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEntry} disabled={isLoading} className="bg-orange-600">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Diário
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {entries.length > 0 ? (
            entries.map(entry => (
              <Card key={entry.id} className="border-slate-200 hover:border-orange-200 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Relatório Diário - {format(new Date(entry.date + 'T12:00:00'), 'dd/MM/yyyy')}</CardTitle>
                      <CardDescription>Registrado por {entry.authorName}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 mr-4">
                      <WeatherIcon type={entry.weather.morning} label="Manhã" />
                      <WeatherIcon type={entry.weather.afternoon} label="Tarde" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleDeleteEntry(entry.id)} disabled={isEntryLocked(entry)}>
                      <Trash2 size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportPDF(entry)}>
                      <Download size={14} className="mr-2" /> PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Atividades</p>
                    <p className="text-sm text-slate-700 line-clamp-2">{entry.activities}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Efetivo</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.manpower?.map((m, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{m.role}: {m.count}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Ocorrências</p>
                    <p className="text-sm text-red-600 line-clamp-2">{entry.occurrences || 'Nenhuma ocorrência registrada.'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Fotos</p>
                    <div className="flex gap-1">
                      {entry.photos?.slice(0, 3).map((p, i) => (
                        <img key={i} src={p} className="w-8 h-8 rounded object-cover border" />
                      ))}
                      {(entry.photos?.length || 0) > 3 && <span className="text-[10px] text-slate-400">+{entry.photos!.length - 3}</span>}
                    </div>
                  </div>
                </CardContent>
                {isEntryLocked(entry) && (
                  <div className="px-4 py-1 bg-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> Registro bloqueado para edição (48h transcorridas)
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>{selectedProjectId ? 'Nenhum registro encontrado para esta obra.' : 'Selecione uma obra para ver o histórico do diário.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeatherToggle({ active, onClick, icon }: any) {
  return (
    <Button 
      variant={active ? 'default' : 'outline'} 
      size="icon" 
      className={`h-10 w-10 ${active ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}

function WeatherIcon({ type, label }: any) {
  const icons = {
    sunny: <Sun size={14} className="text-yellow-500" />,
    cloudy: <Cloud size={14} className="text-slate-400" />,
    rainy: <CloudRain size={14} className="text-blue-500" />
  };
  return (
    <div className="flex flex-col items-center px-2 border-r last:border-0 border-slate-100">
      {icons[type as keyof typeof icons]}
      <span className="text-[8px] uppercase font-bold text-slate-400 mt-1">{label}</span>
    </div>
  );
}
