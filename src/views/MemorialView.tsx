import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Save, 
  Download, 
  GripVertical, 
  Trash2, 
  Loader2,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { db } from '../firebase';
import { Project } from '../types';
import { useMemorials } from '../hooks/useMemorials';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface MemorialViewProps {
  projects: Project[];
}

export function MemorialView({ projects }: MemorialViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { sections, loading, createSection, updateSection, deleteSection } = useMemorials(selectedProjectId);

  const handleAddSection = async () => {
    if (!selectedProjectId) return;
    try {
      await createSection({
        title: 'Nova Seção',
        content: '',
        order: sections.length
      });
      toast.success('Nova seção adicionada');
    } catch (error) {
      toast.error('Erro ao adicionar seção');
    }
  };

  // Usamos debounce/delay manual ou não? Simples timeout.
  // Em vez disso, vamos só atualizar direto ou no onBlur para simplificar, mas no mockup atual é onChange.
  const handleUpdateSection = async (id: string, updates: any) => {
    try {
      await updateSection(id, updates);
    } catch (error) {
      toast.error('Erro ao atualizar seção');
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      await deleteSection(id);
      toast.success('Seção removida com sucesso');
    } catch (error) {
      toast.error('Erro ao remover seção');
    }
  };

  const handleExportPDF = () => {
    if (!selectedProjectId || sections.length === 0) return;
    
    const project = projects.find(p => p.id === selectedProjectId);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Memorial Descritivo", 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text(project?.name || "", 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Localização: ${project?.location || ""}`, 105, 38, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
    
    let y = 60;
    sections.forEach((section) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, 20, y);
      y += 10;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(section.content, 170);
      doc.text(splitText, 20, y);
      y += (splitText.length * 6) + 15;
    });
    
    doc.save(`Memorial_${project?.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportDocx = async () => {
    if (!selectedProjectId || sections.length === 0) return;
    const project = projects.find(p => p.id === selectedProjectId);

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Memorial Descritivo",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: project?.name || "",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Localização: ${project?.location || ""}`,
            alignment: AlignmentType.CENTER,
          }),
          ...sections.flatMap(section => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400 },
            }),
            new Paragraph({
              text: section.content,
              spacing: { after: 200 },
            })
          ])
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Memorial_${project?.name.replace(/\s+/g, '_')}.docx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Memorial Descritivo</h3>
          <p className="text-slate-500">Elaboração técnica das especificações e materiais da obra</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full sm:w-[250px] bg-white">
              <SelectValue placeholder="Selecione a Obra" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="outline" onClick={handleExportDocx}>
            <Download className="mr-2 h-4 w-4" /> Exportar DOCX
          </Button>
          <Button disabled={!selectedProjectId} onClick={handleAddSection} className="bg-orange-600">
            <Plus className="mr-2 h-4 w-4" /> Nova Seção
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <Card key={section.id} className="border-slate-200 shadow-sm group">
              <CardHeader className="flex flex-row items-center gap-4 py-3 bg-slate-50/50">
                <div className="cursor-grab text-slate-300 hover:text-slate-500">
                  <GripVertical size={20} />
                </div>
                <Input 
                  className="font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 h-auto"
                  value={section.title}
                  onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 ml-auto h-8 w-8"
                  onClick={() => handleDeleteSection(section.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea 
                  className="min-h-[150px] border-none focus:ring-0 rounded-none p-6 text-slate-600 leading-relaxed"
                  placeholder="Descreva as especificações técnicas desta seção..."
                  value={section.content}
                  onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>{selectedProjectId ? 'Comece adicionando a primeira seção do memorial.' : 'Selecione uma obra para editar o memorial.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
