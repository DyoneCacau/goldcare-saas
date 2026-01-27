import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, CreditCard, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Stats {
  totalClinics: number;
  activeClinics: number;
  trialClinics: number;
  suspendedClinics: number;
  paidSubscriptions: number;
  overdueSubscriptions: number;
  planDistribution: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function SuperAdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalClinics: 0,
    activeClinics: 0,
    trialClinics: 0,
    suspendedClinics: 0,
    paidSubscriptions: 0,
    overdueSubscriptions: 0,
    planDistribution: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Fetch clinics
      const { data: clinics } = await supabase.from('clinics').select('*');
      
      // Fetch subscriptions with plans
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, plans(name)');

      // Fetch plans for distribution
      const { data: plans } = await supabase.from('plans').select('*');

      const totalClinics = clinics?.length || 0;
      const activeClinics = clinics?.filter(c => c.is_active).length || 0;
      
      const trialClinics = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const suspendedClinics = subscriptions?.filter(s => s.status === 'suspended').length || 0;
      const paidSubscriptions = subscriptions?.filter(s => s.payment_status === 'paid').length || 0;
      const overdueSubscriptions = subscriptions?.filter(s => s.payment_status === 'overdue').length || 0;

      // Calculate plan distribution
      const planCounts: Record<string, number> = {};
      subscriptions?.forEach(sub => {
        const planName = (sub.plans as any)?.name || 'Sem plano';
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      });

      const planDistribution = Object.entries(planCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setStats({
        totalClinics,
        activeClinics,
        trialClinics,
        suspendedClinics,
        paidSubscriptions,
        overdueSubscriptions,
        planDistribution,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusData = [
    { name: 'Trial', value: stats.trialClinics },
    { name: 'Ativas', value: stats.activeClinics - stats.trialClinics },
    { name: 'Suspensas', value: stats.suspendedClinics },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClinics}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClinics} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialClinics}</div>
            <p className="text-xs text-muted-foreground">
              7 dias de teste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adimplentes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos em dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Pagamentos atrasados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
