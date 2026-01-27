import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { FinancialReport } from '@/components/reports/FinancialReport';
import { AppointmentReport } from '@/components/reports/AppointmentReport';
import { PatientReport } from '@/components/reports/PatientReport';
import { ProductivityReport } from '@/components/reports/ProductivityReport';
import { CommissionReport } from '@/components/commissions/CommissionReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockClinics } from '@/data/mockClinics';
import { mockProfessionals } from '@/data/mockAgenda';
import { mockFinancialSummary, mockAppointmentSummary, mockPatientSummary, mockProductivityReports } from '@/data/mockReports';
import { mockCommissionCalculations } from '@/data/mockCommissions';
import { FileBarChart, DollarSign, Calendar, Users, TrendingUp, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';
import { useFeatureAccess } from '@/components/subscription/FeatureAction';

export default function Reports() {
  const { canAccess: canExport } = useFeatureAccess('relatorios');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState('all');

  const handleExportPDF = () => {
    if (!canExport) {
      toast.error('Exportação não disponível no seu plano');
      return;
    }
    toast.info('Exportação PDF em desenvolvimento');
  };
  
  const handleExportExcel = () => {
    if (!canExport) {
      toast.error('Exportação não disponível no seu plano');
      return;
    }
    toast.info('Exportação Excel em desenvolvimento');
  };
  
  const handlePrint = () => window.print();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-primary" />
            Relatórios Gerenciais
          </h1>
          <p className="text-muted-foreground">Análise completa do desempenho da clínica</p>
        </div>

        <ReportFilters
          startDate={startDate} endDate={endDate} selectedClinic={selectedClinic} selectedProfessional={selectedProfessional}
          onStartDateChange={setStartDate} onEndDateChange={setEndDate} onClinicChange={setSelectedClinic} onProfessionalChange={setSelectedProfessional}
          clinics={mockClinics} professionals={mockProfessionals}
          onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} onPrint={handlePrint}
        />

        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="financial" className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Financeiro</TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2"><Percent className="h-4 w-4" />Comissões</TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Agendamentos</TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2"><Users className="h-4 w-4" />Pacientes</TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Produtividade</TabsTrigger>
          </TabsList>
          <TabsContent value="financial"><FinancialReport data={mockFinancialSummary} /></TabsContent>
          <TabsContent value="commissions"><CommissionReport calculations={mockCommissionCalculations} /></TabsContent>
          <TabsContent value="appointments"><AppointmentReport data={mockAppointmentSummary} /></TabsContent>
          <TabsContent value="patients"><PatientReport data={mockPatientSummary} /></TabsContent>
          <TabsContent value="productivity"><ProductivityReport data={mockProductivityReports} /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
