import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, DollarSign, Percent, TrendingUp, Clock, CheckCircle, Instagram, MessageCircle, Share2, Megaphone, HelpCircle, Stethoscope, UserCheck, Headphones, Lock, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CommissionSummary, CommissionCalculation, beneficiaryTypeLabels, BeneficiaryType } from '@/types/commission';
import { leadSourceLabels, LeadSource } from '@/types/agenda';
import { generateCommissionSummary } from '@/data/mockCommissions';
import { CommissionReportFilters } from './CommissionReportFilters';
import { mockClinics } from '@/data/mockClinics';
import { format, subMonths, parseISO, isWithinInterval } from 'date-fns';

interface CommissionReportProps {
  calculations: CommissionCalculation[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const leadSourceIcons: Record<LeadSource, typeof Instagram> = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  referral: Share2,
  paid_traffic: Megaphone,
  other: HelpCircle,
};

const beneficiaryIcons: Record<BeneficiaryType, typeof Stethoscope> = {
  professional: Stethoscope,
  seller: UserCheck,
  reception: Headphones,
};

export function CommissionReport({ calculations }: CommissionReportProps) {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [selectedBeneficiaryType, setSelectedBeneficiaryType] = useState('all');

  // Filter calculations based on selected filters
  const filteredCalculations = useMemo(() => {
    return calculations.filter(calc => {
      // Filter by date range
      const calcDate = parseISO(calc.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (!isWithinInterval(calcDate, { start, end })) return false;

      // Filter by clinic
      if (selectedClinic !== 'all' && calc.clinicId !== selectedClinic) return false;

      // Filter by beneficiary type
      if (selectedBeneficiaryType !== 'all' && calc.beneficiaryType !== selectedBeneficiaryType) return false;

      return true;
    });
  }, [calculations, startDate, endDate, selectedClinic, selectedBeneficiaryType]);

  const summary = useMemo(() => generateCommissionSummary(filteredCalculations), [filteredCalculations]);

  // Separate summaries by beneficiary type
  const summaryByType = useMemo(() => {
    return {
      professional: summary.filter(s => s.beneficiaryType === 'professional'),
      seller: summary.filter(s => s.beneficiaryType === 'seller'),
      reception: summary.filter(s => s.beneficiaryType === 'reception'),
    };
  }, [summary]);

  const totals = useMemo(() => {
    return {
      totalRevenue: summary.reduce((acc, s) => acc + s.totalRevenue, 0),
      totalCommission: summary.reduce((acc, s) => acc + s.totalCommission, 0),
      pendingCommission: summary.reduce((acc, s) => acc + s.pendingCommission, 0),
      paidCommission: summary.reduce((acc, s) => acc + s.paidCommission, 0),
      totalServices: summary.reduce((acc, s) => acc + s.totalServices, 0),
    };
  }, [summary]);

  // Totals by beneficiary type
  const totalsByType = useMemo(() => {
    const byType: Record<BeneficiaryType, { total: number; pending: number; paid: number }> = {
      professional: { total: 0, pending: 0, paid: 0 },
      seller: { total: 0, pending: 0, paid: 0 },
      reception: { total: 0, pending: 0, paid: 0 },
    };

    summary.forEach(s => {
      byType[s.beneficiaryType].total += s.totalCommission;
      byType[s.beneficiaryType].pending += s.pendingCommission;
      byType[s.beneficiaryType].paid += s.paidCommission;
    });

    return byType;
  }, [summary]);

  // Lead source breakdown
  const leadSourceStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number; commission: number }> = {};
    filteredCalculations.forEach(calc => {
      const source = calc.leadSource || 'other';
      if (!stats[source]) {
        stats[source] = { count: 0, revenue: 0, commission: 0 };
      }
      if (calc.beneficiaryType === 'professional') {
        stats[source].count++;
        stats[source].revenue += calc.serviceValue;
      }
      stats[source].commission += calc.commissionAmount;
    });
    return Object.entries(stats).map(([source, data]) => ({
      name: leadSourceLabels[source as LeadSource] || source,
      source: source as LeadSource,
      ...data,
    }));
  }, [filteredCalculations]);

  // Count immutable (paid) commissions
  const paidCount = filteredCalculations.filter(c => c.status === 'paid').length;

  const chartData = summary.map((s) => ({
    name: s.professionalName.split(' ').slice(0, 2).join(' '),
    comissao: s.totalCommission,
    pendente: s.pendingCommission,
    pago: s.paidCommission,
  }));

  const pieData = Object.entries(totalsByType).map(([type, data], index) => ({
    name: beneficiaryTypeLabels[type as BeneficiaryType],
    value: data.total,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const statusData = [
    { name: 'Pago', value: totals.paidCommission, color: '#10b981' },
    { name: 'Pendente', value: totals.pendingCommission, color: '#f59e0b' },
  ];

  const handleExport = () => {
    // TODO: Implement export
    console.log('Exporting commission report...');
  };

  const renderBeneficiaryTable = (data: CommissionSummary[], title: string, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-2">{data.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma comissão neste período
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Atend.</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.professionalId}>
                  <TableCell className="font-medium">{s.professionalName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{s.totalServices}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(s.totalCommission)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {formatCurrency(s.pendingCommission)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatCurrency(s.paidCommission)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Subtotal</TableCell>
                <TableCell className="text-center">{data.reduce((acc, s) => acc + s.totalServices, 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.reduce((acc, s) => acc + s.totalCommission, 0))}</TableCell>
                <TableCell className="text-right text-amber-600">{formatCurrency(data.reduce((acc, s) => acc + s.pendingCommission, 0))}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrency(data.reduce((acc, s) => acc + s.paidCommission, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CommissionReportFilters
        startDate={startDate}
        endDate={endDate}
        selectedClinic={selectedClinic}
        selectedBeneficiaryType={selectedBeneficiaryType}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClinicChange={setSelectedClinic}
        onBeneficiaryTypeChange={setSelectedBeneficiaryType}
        clinics={mockClinics}
        onExport={handleExport}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Percent className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-xl font-bold">{formatCurrency(totals.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(totals.pendingCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totals.paidCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Lock className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Imutáveis</p>
                <p className="text-xl font-bold">{paidCount}</p>
                <p className="text-xs text-muted-foreground">comissões pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert about immutable rules */}
      {paidCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">
            <strong>{paidCount} comissão(ões)</strong> já foi(ram) paga(s) e não pode(m) ser editada(s) ou excluída(s).
          </p>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="by-type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-type">Por Tipo de Beneficiário</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="lead-source">Por Origem do Lead</TabsTrigger>
          <TabsTrigger value="detailed">Tabela Detalhada</TabsTrigger>
        </TabsList>

        {/* By Type Tab */}
        <TabsContent value="by-type" className="space-y-4">
          {/* Type summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(totalsByType) as [BeneficiaryType, { total: number; pending: number; paid: number }][]).map(([type, data]) => {
              const Icon = beneficiaryIcons[type];
              return (
                <Card key={type} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-primary/5" />
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{beneficiaryTypeLabels[type]}</p>
                          <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendente</span>
                      <span className="font-medium text-amber-600">{formatCurrency(data.pending)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Pago</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(data.paid)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tables by type */}
          <div className="space-y-4">
            {renderBeneficiaryTable(
              summaryByType.professional,
              'Profissionais (Dentistas)',
              <Stethoscope className="h-4 w-4 text-primary" />
            )}
            {renderBeneficiaryTable(
              summaryByType.seller,
              'Vendedores',
              <UserCheck className="h-4 w-4 text-blue-600" />
            )}
            {renderBeneficiaryTable(
              summaryByType.reception,
              'Recepção',
              <Headphones className="h-4 w-4 text-purple-600" />
            )}
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comissões por Beneficiário</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `R$ ${(v / 1).toFixed(0)}`} />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="pago" name="Pago" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendente" name="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Pago</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(totals.paidCommission)}</span>
                </div>
                <Progress
                  value={totals.totalCommission > 0 ? (totals.paidCommission / totals.totalCommission) * 100 : 0}
                  className="h-3 bg-muted"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Pendente</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(totals.pendingCommission)}</span>
                </div>
                <Progress
                  value={totals.totalCommission > 0 ? (totals.pendingCommission / totals.totalCommission) * 100 : 0}
                  className="h-3 bg-muted [&>div]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Source Tab */}
        <TabsContent value="lead-source">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Análise por Origem do Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {leadSourceStats.map((stat) => {
                  const Icon = leadSourceIcons[stat.source] || HelpCircle;
                  return (
                    <div key={stat.source} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{stat.name}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {stat.count} atendimento(s)
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(stat.revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Table Tab */}
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Atendimentos</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Comissão Total</TableHead>
                    <TableHead className="text-right">Taxa Média</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s) => (
                    <TableRow key={`${s.beneficiaryType}-${s.professionalId}`}>
                      <TableCell className="font-medium">{s.professionalName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {beneficiaryTypeLabels[s.beneficiaryType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{s.totalServices}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(s.totalRevenue)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(s.totalCommission)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{s.averageCommissionRate.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        {formatCurrency(s.pendingCommission)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(s.paidCommission)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-center">{totals.totalServices}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalCommission)}</TableCell>
                    <TableCell className="text-right">
                      <Badge>
                        {totals.totalRevenue > 0 ? ((totals.totalCommission / totals.totalRevenue) * 100).toFixed(1) : '0'}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {formatCurrency(totals.pendingCommission)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(totals.paidCommission)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
