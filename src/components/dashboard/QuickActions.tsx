import { CalendarPlus, UserPlus, Receipt, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    icon: CalendarPlus,
    label: "Novo Agendamento",
    description: "Agendar consulta",
  },
  {
    icon: UserPlus,
    label: "Novo Paciente",
    description: "Cadastrar paciente",
  },
  {
    icon: Receipt,
    label: "Novo Lançamento",
    description: "Registrar movimento",
  },
  {
    icon: FileText,
    label: "Gerar Relatório",
    description: "Exportar dados",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 font-semibold text-foreground">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 p-4 hover:border-primary hover:bg-accent"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
