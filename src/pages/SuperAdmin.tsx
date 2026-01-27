import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicsManagement } from "@/components/superadmin/ClinicsManagement";
import { PlansManagement } from "@/components/superadmin/PlansManagement";
import { SubscriptionsManagement } from "@/components/superadmin/SubscriptionsManagement";
import { PaymentsManagement } from "@/components/superadmin/PaymentsManagement";
import { SuperAdminStats } from "@/components/superadmin/SuperAdminStats";
import { UpgradeRequestsManagement } from "@/components/superadmin/UpgradeRequestsManagement";
import { Building2, CreditCard, Package, Receipt, LayoutDashboard, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function SuperAdmin() {
  const { isSuperAdmin, isLoading } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPendingCount();
    }
  }, [isSuperAdmin]);

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('upgrade_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingRequests(count || 0);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel SuperAdmin</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie clínicas, planos e assinaturas da plataforma
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 relative">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
              {pendingRequests > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs absolute -top-1 -right-1">
                  {pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clinics" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clínicas</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Planos</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Assinaturas</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <SuperAdminStats />
          </TabsContent>

          <TabsContent value="requests">
            <UpgradeRequestsManagement />
          </TabsContent>

          <TabsContent value="clinics">
            <ClinicsManagement />
          </TabsContent>

          <TabsContent value="plans">
            <PlansManagement />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsManagement />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}