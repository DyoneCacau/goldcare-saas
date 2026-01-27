import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", receitas: 18500, despesas: 8200 },
  { month: "Fev", receitas: 22300, despesas: 9100 },
  { month: "Mar", receitas: 19800, despesas: 7800 },
  { month: "Abr", receitas: 24500, despesas: 10200 },
  { month: "Mai", receitas: 27800, despesas: 11500 },
  { month: "Jun", receitas: 25200, despesas: 9800 },
];

export function RevenueChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">Receitas vs Despesas</h3>
        <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 80%, 32%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 80%, 32%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis
              dataKey="month"
              stroke="hsl(220, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(220, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 20%, 90%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                `R$ ${value.toLocaleString("pt-BR")}`,
              ]}
            />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="hsl(168, 80%, 32%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorReceitas)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="hsl(0, 72%, 51%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDespesas)"
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
      </div>
    </div>
  );
}
