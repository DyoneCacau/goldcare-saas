import { Calendar, Users, Stethoscope, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Bem-vindo ao ClinSoft • Terça, 21 de Janeiro de 2025"
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Agendamentos Hoje"
            value={12}
            subtitle="vs ontem"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Total de Pacientes"
            value="1.248"
            subtitle="este mês"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="info"
          />
          <StatCard
            title="Profissionais Ativos"
            value={8}
            subtitle="disponíveis hoje"
            icon={Stethoscope}
            variant="success"
          />
          <StatCard
            title="Saldo do Dia"
            value="R$ 4.850"
            subtitle="vs média"
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Appointments List */}
        <div className="mt-6">
          <AppointmentsList />
        </div>
      </div>
    </div>
  );
}
