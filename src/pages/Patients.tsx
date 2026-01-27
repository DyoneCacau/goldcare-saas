import { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { PatientsList } from '@/components/patients/PatientsList';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { PatientDetailsDialog } from '@/components/patients/PatientDetailsDialog';
import { WhatsAppConfirmationDialog } from '@/components/patients/WhatsAppConfirmationDialog';
import { Patient } from '@/types/patient';
import { mockPatients } from '@/data/mockPatients';
import { mockAppointmentsWithClinic } from '@/data/mockClinics';

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm) ||
        patient.phone.includes(searchTerm);
      
      const matchesStatus =
        statusFilter === 'all' || patient.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormDialogOpen(true);
  };

  const handleWhatsApp = (patient: Patient) => {
    setSelectedPatient(patient);
    setWhatsAppDialogOpen(true);
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setFormDialogOpen(true);
  };

  const handleSave = (patientData: Omit<Patient, 'id' | 'createdAt'> & { id?: string }) => {
    if (patientData.id) {
      // Update existing patient
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientData.id
            ? { ...p, ...patientData }
            : p
        )
      );
    } else {
      // Create new patient
      const newPatient: Patient = {
        ...patientData,
        id: String(Date.now()),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setPatients((prev) => [newPatient, ...prev]);
    }
  };

  const activeCount = patients.filter((p) => p.status === 'active').length;
  const inactiveCount = patients.filter((p) => p.status === 'inactive').length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie os pacientes da clínica
            </p>
          </div>
          <Button onClick={handleNewPatient} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-card border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-card border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-card border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveCount}</p>
                <p className="text-sm text-muted-foreground">Pacientes Inativos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <PatientSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
        </p>

        {/* Patients List */}
        <PatientsList
          patients={filteredPatients}
          onView={handleView}
          onEdit={handleEdit}
          onWhatsApp={handleWhatsApp}
        />

        {/* Form Dialog */}
        <PatientFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          patient={editingPatient}
          onSave={handleSave}
        />

        {/* Details Dialog */}
        <PatientDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          patient={selectedPatient}
          appointments={selectedPatient ? mockAppointmentsWithClinic[selectedPatient.id] || [] : []}
        />

        {/* WhatsApp Confirmation Dialog */}
        <WhatsAppConfirmationDialog
          open={whatsAppDialogOpen}
          onOpenChange={setWhatsAppDialogOpen}
          patient={selectedPatient}
          appointments={selectedPatient ? mockAppointmentsWithClinic[selectedPatient.id] || [] : []}
        />
      </div>
    </MainLayout>
  );
};

export default Patients;
