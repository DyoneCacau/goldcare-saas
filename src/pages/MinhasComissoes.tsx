import { MainLayout } from '@/components/layout/MainLayout';
import { MyCommissions } from '@/components/commissions/MyCommissions';
import { useAuth } from '@/hooks/useAuth';

export default function MinhasComissoes() {
  const { profile } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas comissões e valores recebidos
          </p>
        </div>

        <MyCommissions beneficiaryId={profile?.id} />
      </div>
    </MainLayout>
  );
}
