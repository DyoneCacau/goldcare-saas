import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppointments } from '@/hooks/useAppointments';
import { useCompleteAppointmentWithPayment } from '@/hooks/useCompleteAppointmentWithPayment';
import { toast } from 'sonner';

export default function AgendaReal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'confirmed' | 'all'>('all');

  // Buscar agendamentos do Supabase
  const { data: appointments = [], isLoading, error } = useAppointments({
    date: format(selectedDate, 'yyyy-MM-dd'),
    professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const { mutate: completeAppointment, isPending: isCompleting } = useCompleteAppointmentWithPayment();

  const handleCompleteAppointment = (appointmentId: string) => {
    completeAppointment({
      appointmentId,
      paymentMethod: 'pix', // Pode ser configurável
      description: 'Pagamento do atendimento',
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando agendamentos...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center text-destructive">
          Erro ao carregar agendamentos: {error.message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">
              {appointments.length} agendamento(s) para {format(selectedDate, 'dd/MM/yyyy')}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          {appointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum agendamento encontrado para esta data
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{apt.start_time}</span>
                      <span>-</span>
                      <span>{apt.patient?.name || 'Paciente'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {apt.professional?.name} • {apt.procedure_name} • R$ {apt.procedure_value.toFixed(2)}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {apt.status === 'confirmed' ? 'Confirmado' :
                         apt.status === 'pending' ? 'Pendente' :
                         apt.status === 'completed' ? 'Concluído' :
                         apt.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {apt.status === 'confirmed' && (
                      <Button
                        onClick={() => handleCompleteAppointment(apt.id)}
                        disabled={isCompleting}
                        size="sm"
                      >
                        {isCompleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finalizando...
                          </>
                        ) : (
                          'Finalizar Atendimento'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
