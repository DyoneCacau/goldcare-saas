import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Building2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Patient } from '@/types/patient';
import { AppointmentWithClinic } from '@/types/clinic';
import { DentalChart as DentalChartType } from '@/types/dental';
import { DentalChart } from './DentalChart';
import { mockDentalCharts, generateEmptyDentalChart } from '@/data/mockDentalCharts';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  appointments: AppointmentWithClinic[];
}

const getStatusConfig = (status: AppointmentWithClinic['status']) => {
  switch (status) {
    case 'completed':
      return { label: 'Concluída', icon: CheckCircle, className: 'bg-success text-success-foreground' };
    case 'confirmed':
      return { label: 'Confirmada', icon: Clock, className: 'bg-primary text-primary-foreground' };
    case 'pending':
      return { label: 'Pendente', icon: Timer, className: 'bg-warning text-warning-foreground' };
    case 'cancelled':
      return { label: 'Cancelada', icon: XCircle, className: 'bg-destructive text-destructive-foreground' };
    default:
      return { label: status, icon: Clock, className: 'bg-muted text-muted-foreground' };
  }
};

export const PatientDetailsDialog = ({
  open,
  onOpenChange,
  patient,
  appointments,
}: PatientDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState('info');
  const [dentalChart, setDentalChart] = useState<DentalChartType | null>(null);

  if (!patient) return null;

  // Load dental chart for patient
  const currentChart = dentalChart || mockDentalCharts[patient.id] || generateEmptyDentalChart(patient.id);

  const handleUpdateChart = (updatedChart: DentalChartType) => {
    setDentalChart(updatedChart);
    // In a real app, this would save to database
  };

  const age = differenceInYears(new Date(), parseISO(patient.birthDate));
  const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );

  // Group appointments by clinic
  const clinicsSet = new Set(appointments.map((a) => a.clinic.id));
  const totalClinics = clinicsSet.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div>
              <DialogTitle className="text-xl">{patient.name}</DialogTitle>
              <p className="text-muted-foreground">
                {age} anos • CPF: {patient.cpf}
              </p>
            </div>
            <Badge
              variant={patient.status === 'active' ? 'default' : 'secondary'}
              className={`ml-auto ${patient.status === 'active' ? 'bg-success hover:bg-success/90' : ''}`}
            >
              {patient.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="dental">Odontograma</TabsTrigger>
            <TabsTrigger value="clinical">Dados Clínicos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{patient.address || 'Não informado'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Nascimento:{' '}
                      {format(parseISO(patient.birthDate), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Idade: {age} anos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Cadastro:{' '}
                      {format(parseISO(patient.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{appointments.length}</p>
                      <p className="text-sm text-muted-foreground">Total de Consultas</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-success">{completedAppointments}</p>
                      <p className="text-sm text-muted-foreground">Realizadas</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-warning">{upcomingAppointments.length}</p>
                      <p className="text-sm text-muted-foreground">Agendadas</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-info">{totalClinics}</p>
                      <p className="text-sm text-muted-foreground">Clínicas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dental" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <DentalChart
                chart={currentChart}
                onUpdateChart={handleUpdateChart}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="clinical" className="mt-4">
            <div className="space-y-4">
              {patient.allergies.length > 0 && (
                <Card className="border-destructive/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Alergias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy) => (
                        <Badge key={allergy} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Observações Clínicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {patient.clinicalNotes || 'Nenhuma observação clínica registrada.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma consulta registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((appointment) => {
                      const statusConfig = getStatusConfig(appointment.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <Card key={appointment.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{appointment.procedure}</span>
                                  <Badge className={statusConfig.className}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.professional}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {appointment.clinic.name}
                                </div>
                                {appointment.notes && (
                                  <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                                    {appointment.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm">
                                <p className="font-medium">
                                  {format(parseISO(appointment.date), "dd 'de' MMM", {
                                    locale: ptBR,
                                  })}
                                </p>
                                <p className="text-muted-foreground">{appointment.time}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
