import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TermsList } from '@/components/terms/TermsList';
import { TermEditor } from '@/components/terms/TermEditor';
import { TermPrintPreview } from '@/components/terms/TermPrintPreview';
import { ClinicBrandingEditor } from '@/components/terms/ClinicBrandingEditor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockClinics } from '@/data/mockClinics';
import { mockConsentTerms, mockClinicBranding } from '@/data/mockTerms';
import { mockPatients } from '@/data/mockPatients';
import { ConsentTerm, ClinicBranding } from '@/types/terms';
import { FileText, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Terms() {
  const [selectedClinic, setSelectedClinic] = useState(mockClinics[0].id);
  const [terms, setTerms] = useState<ConsentTerm[]>(mockConsentTerms);
  const [brandings, setBrandings] = useState<ClinicBranding[]>(mockClinicBranding);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<ConsentTerm | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printingTerm, setPrintingTerm] = useState<ConsentTerm | null>(null);

  const clinic = mockClinics.find((c) => c.id === selectedClinic)!;
  const clinicTerms = terms.filter((t) => t.clinicId === selectedClinic);
  const clinicBranding = brandings.find((b) => b.clinicId === selectedClinic) || { clinicId: selectedClinic };
  const samplePatient = mockPatients[0];

  const handleNewTerm = () => {
    setEditingTerm(null);
    setEditorOpen(true);
  };

  const handleEditTerm = (term: ConsentTerm) => {
    setEditingTerm(term);
    setEditorOpen(true);
  };

  const handlePrintTerm = (term: ConsentTerm) => {
    setPrintingTerm(term);
    setPrintPreviewOpen(true);
  };

  const handleDeleteTerm = (termId: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== termId));
    toast.success('Termo excluído com sucesso!');
  };

  const handleSaveTerm = (termData: Partial<ConsentTerm>) => {
    if (editingTerm) {
      setTerms((prev) => prev.map((t) => (t.id === editingTerm.id ? { ...t, ...termData } as ConsentTerm : t)));
      toast.success('Termo atualizado com sucesso!');
    } else {
      setTerms((prev) => [...prev, termData as ConsentTerm]);
      toast.success('Termo criado com sucesso!');
    }
  };

  const handleSaveBranding = (branding: ClinicBranding) => {
    setBrandings((prev) => {
      const exists = prev.find((b) => b.clinicId === branding.clinicId);
      if (exists) {
        return prev.map((b) => (b.clinicId === branding.clinicId ? branding : b));
      }
      return [...prev, branding];
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Termos de Consentimento
            </h1>
            <p className="text-muted-foreground">Gerencie os termos e documentos da clínica</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger className="w-[280px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockClinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleNewTerm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Termo
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TermsList terms={clinicTerms} onEdit={handleEditTerm} onPrint={handlePrintTerm} onDelete={handleDeleteTerm} />
          </div>
          <div>
            <ClinicBrandingEditor branding={clinicBranding} onSave={handleSaveBranding} />
          </div>
        </div>
      </div>

      <TermEditor open={editorOpen} onOpenChange={setEditorOpen} term={editingTerm} clinicId={selectedClinic} onSave={handleSaveTerm} />
      
      {printingTerm && (
        <TermPrintPreview open={printPreviewOpen} onOpenChange={setPrintPreviewOpen} term={printingTerm} branding={clinicBranding} patient={samplePatient} clinicName={clinic.name} />
      )}
    </MainLayout>
  );
}
