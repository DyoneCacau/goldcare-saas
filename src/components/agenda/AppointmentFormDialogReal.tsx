import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreateAppointment, useUpdateAppointment, Appointment, CreateAppointmentInput } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useProfessionals } from '@/hooks/useProfessionals';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AppointmentFormDialogRealProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  selectedDate?: Date;
}

export function AppointmentFormDialogReal({
  open,
  onOpenChange,
  appointment,
  selectedDate,
}: AppointmentFormDialogRealProps) {
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [patientId, setPatientId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [procedure, setProcedure] = useState('');
  const [procedureValue, setProcedureValue] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('pending');
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { patients = [] } = usePatients();
  const { data: professionals = [] } = useProfessionals();
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();

  const isEditing = !!appointment;
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (appointment) {
      setDate(new Date(appointment.appointment_date));
      setStartTime(appointment.start_time);
      setEndTime(appointment.end_time);
      setPatientId(appointment.patient_id);
      setProfessionalId(appointment.professional_id);
      setProcedure(appointment.procedure_name);
      setProcedureValue(String(appointment.procedure_value));
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
    } else {
      // Reset form
      setDate(selectedDate || new Date());
      setStartTime('09:00');
      setEndTime('09:30');
      setPatientId('');
      setProfessionalId('');
      setProcedure('');
      setProcedureValue('');
      setStatus('pending');
      setNotes('');
    }
  }, [appointment, open, selectedDate]);

  const handleSave = () => {
    if (!patientId || !professionalId || !procedure || !procedureValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const appointmentData: CreateAppointmentInput = {
      patient_id: patientId,
      professional_id: professionalId,
      appointment_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      procedure_name: procedure,
      procedure_value: parseFloat(procedureValue),
      status,
      notes: notes || undefined,
    };

    if (isEditing && appointment) {
      updateAppointment(
        { id: appointment.id, ...appointmentData },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createAppointment(appointmentData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const timeOptions = [];
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do agendamento'
              : 'Preencha os dados para criar um novo agendamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients
                  .filter((p) => p.status === 'active')
                  .map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professional">Profissional *</Label>
              <Select value={professionalId} onValueChange={setProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {professionals
                    .filter((p) => p.is_active)
                    .map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name} - {prof.specialty}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Horário Início *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Horário Fim *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="procedure">Procedimento *</Label>
              <Input
                id="procedure"
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                placeholder="Ex: Consulta geral, Limpeza dental..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="procedureValue">Valor (R$) *</Label>
              <Input
                id="procedureValue"
                type="number"
                step="0.01"
                value={procedureValue}
                onChange={(e) => setProcedureValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Appointment['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="rescheduled">Reagendado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Salvando...' : 'Criando...'}
              </>
            ) : isEditing ? (
              'Salvar Alterações'
            ) : (
              'Criar Agendamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
