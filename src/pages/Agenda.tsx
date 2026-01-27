import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgendaFilters } from '@/components/agenda/AgendaFilters';
import { AgendaStats } from '@/components/agenda/AgendaStats';
import { DayView } from '@/components/agenda/DayView';
import { WeekView } from '@/components/agenda/WeekView';
import { MonthView } from '@/components/agenda/MonthView';
import { AppointmentFormDialog } from '@/components/agenda/AppointmentFormDialog';
import { CompleteAppointmentDialog } from '@/components/agenda/CompleteAppointmentDialog';
import { AgendaAppointment, AgendaView } from '@/types/agenda';
import { PaymentMethod } from '@/types/financial';
import { mockAgendaAppointments, mockProfessionals } from '@/data/mockAgenda';
import { mockClinics } from '@/data/mockClinics';
import { useCompleteAppointment } from '@/hooks/useCompleteAppointment';
import { toast } from 'sonner';

export default function Agenda() {
  const completeAppointmentMutation = useCompleteAppointment();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [view, setView] = useState<AgendaView>('day');
  const [appointments, setAppointments] = useState<AgendaAppointment[]>(mockAgendaAppointments);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AgendaAppointment | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<AgendaAppointment | null>(null);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;
      if (selectedProfessional !== 'all' && apt.professional.id !== selectedProfessional) return false;
      if (selectedClinic !== 'all' && apt.clinic.id !== selectedClinic) return false;
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;
      return true;
    });
  }, [appointments, selectedProfessional, selectedClinic, selectedStatus]);

  const dateFilteredAppointments = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return filteredAppointments.filter((apt) => apt.date === dateStr);
  }, [filteredAppointments, selectedDate]);

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (appointment: AgendaAppointment) => {
    setEditingAppointment(appointment);
    setFormDialogOpen(true);
  };

  const handleCancel = (appointment: AgendaAppointment) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointment.id ? { ...apt, status: 'cancelled' as const } : apt
      )
    );
    toast.success('Agendamento cancelado');
  };

  const handleConfirm = (appointment: AgendaAppointment) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointment.id ? { ...apt, status: 'confirmed' as const } : apt
      )
    );
    toast.success('Agendamento confirmado');
  };

  const handleComplete = (appointment: AgendaAppointment) => {
    setCompletingAppointment(appointment);
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async (
    appointment: AgendaAppointment,
    serviceValue: number,
    paymentMethod: PaymentMethod,
    quantity: number
  ) => {
    try {
      // Calculate and save commissions to Supabase
      await completeAppointmentMutation.mutateAsync({
        appointment,
        serviceValue,
        paymentMethod,
        quantity,
      });

      // Update appointment status locally
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointment.id
            ? { ...apt, status: 'completed' as const, paymentStatus: 'paid' as const }
            : apt
        )
      );
    } catch (error) {
      console.error('Error completing appointment:', error);
      // Toast is handled by the mutation hook
    }
  };

  const handleWhatsApp = (appointment: AgendaAppointment) => {
    const patient = { phone: '(11) 99999-1234' }; // In real app, fetch from patient data
    const message = `Olá! Confirmando sua consulta:\n📅 Data: ${format(new Date(appointment.date), 'dd/MM/yyyy')}\n⏰ Horário: ${appointment.startTime}\n👨‍⚕️ Profissional: ${appointment.professional.name}\n📍 Local: ${appointment.clinic.name}\n\nPor favor, confirme sua presença respondendo esta mensagem.`;
    const phone = patient.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSave = (data: Partial<AgendaAppointment>) => {
    if (data.id) {
      // Edit existing
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === data.id ? { ...apt, ...data } as AgendaAppointment : apt))
      );
    } else {
      // Create new
      const newAppointment: AgendaAppointment = {
        ...data,
        id: `ag${Date.now()}`,
      } as AgendaAppointment;
      setAppointments((prev) => [...prev, newAppointment]);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setView('day');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os agendamentos da clínica
            </p>
          </div>
          <Button onClick={handleNewAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Stats */}
        <AgendaStats appointments={dateFilteredAppointments} />

        {/* Filters */}
        <AgendaFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedProfessional={selectedProfessional}
          onProfessionalChange={setSelectedProfessional}
          selectedClinic={selectedClinic}
          onClinicChange={setSelectedClinic}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          view={view}
          onViewChange={setView}
          professionals={mockProfessionals}
          clinics={mockClinics}
        />

        {/* Calendar Views */}
        {view === 'day' && (
          <DayView
            date={selectedDate}
            appointments={dateFilteredAppointments}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            onComplete={handleComplete}
            onWhatsApp={handleWhatsApp}
          />
        )}

        {view === 'week' && (
          <WeekView
            date={selectedDate}
            appointments={filteredAppointments}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            onComplete={handleComplete}
            onWhatsApp={handleWhatsApp}
          />
        )}

        {view === 'month' && (
          <MonthView
            date={selectedDate}
            appointments={filteredAppointments}
            onDayClick={handleDayClick}
          />
        )}
      </div>

      {/* Form Dialog */}
      <AppointmentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        appointment={editingAppointment}
        professionals={mockProfessionals}
        clinics={mockClinics}
        existingAppointments={appointments}
        onSave={handleSave}
      />

      {/* Complete Appointment Dialog */}
      <CompleteAppointmentDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        appointment={completingAppointment}
        onComplete={handleCompleteConfirm}
      />
    </MainLayout>
  );
}
