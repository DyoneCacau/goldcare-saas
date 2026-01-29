import { MainLayout } from '@/components/layout/MainLayout';
import { MyClinicsManagement } from '@/components/clinics/MyClinicsManagement';

export default function MyClinics() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas Clínicas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as unidades da sua clínica
          </p>
        </div>
        <MyClinicsManagement />
      </div>
    </MainLayout>
  );
}
