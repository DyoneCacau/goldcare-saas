import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patient: string;
  professional: string;
  procedure: string;
  status: "confirmed" | "pending" | "return";
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    time: "08:00",
    patient: "Maria Silva",
    professional: "Dr. Carlos Oliveira",
    procedure: "Consulta geral",
    status: "confirmed",
  },
  {
    id: "2",
    time: "09:00",
    patient: "João Santos",
    professional: "Dra. Ana Costa",
    procedure: "Limpeza dental",
    status: "pending",
  },
  {
    id: "3",
    time: "10:00",
    patient: "Pedro Almeida",
    professional: "Dr. Carlos Oliveira",
    procedure: "Retorno",
    status: "return",
  },
  {
    id: "4",
    time: "11:00",
    patient: "Lucia Ferreira",
    professional: "Dra. Ana Costa",
    procedure: "Avaliação ortodôntica",
    status: "confirmed",
  },
  {
    id: "5",
    time: "14:00",
    patient: "Roberto Lima",
    professional: "Dr. Carlos Oliveira",
    procedure: "Extração",
    status: "pending",
  },
];

const statusStyles = {
  confirmed: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Confirmado",
  },
  pending: {
    bg: "bg-warning/10",
    text: "text-warning",
    label: "Pendente",
  },
  return: {
    bg: "bg-info/10",
    text: "text-info",
    label: "Retorno",
  },
};

export function AppointmentsList() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-foreground">Próximas Consultas</h3>
        <p className="text-sm text-muted-foreground">Agendamentos de hoje</p>
      </div>
      <div className="divide-y divide-border">
        {mockAppointments.map((appointment) => {
          const status = statusStyles[appointment.status];
          return (
            <div
              key={appointment.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {appointment.time}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      status.bg,
                      status.text
                    )}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="truncate text-sm text-foreground">
                  {appointment.patient}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {appointment.professional} • {appointment.procedure}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-4">
        <button className="w-full text-center text-sm font-medium text-primary hover:underline">
          Ver todos os agendamentos
        </button>
      </div>
    </div>
  );
}
