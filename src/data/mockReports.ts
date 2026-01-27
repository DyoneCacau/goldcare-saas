import { FinancialSummary, AppointmentSummary, PatientSummary, ProductivityReport } from '@/types/reports';

export const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 125680.50,
  totalExpenses: 42350.00,
  netProfit: 83330.50,
  byPaymentMethod: [
    { method: 'Dinheiro', total: 18500.00, count: 45 },
    { method: 'PIX', total: 42300.00, count: 120 },
    { method: 'Cartão Crédito', total: 35800.50, count: 85 },
    { method: 'Cartão Débito', total: 22080.00, count: 62 },
    { method: 'Voucher', total: 7000.00, count: 18 },
  ],
  byPeriod: [
    { period: 'Jan/2025', revenue: 28500, expenses: 9800 },
    { period: 'Dez/2024', revenue: 32100, expenses: 10200 },
    { period: 'Nov/2024', revenue: 29800, expenses: 9500 },
    { period: 'Out/2024', revenue: 35280.50, expenses: 12850 },
  ],
};

export const mockAppointmentSummary: AppointmentSummary = {
  totalAppointments: 485,
  confirmed: 312,
  pending: 98,
  completed: 420,
  cancelled: 65,
  byProfessional: [
    { professional: 'Dra. Carla Mendes', total: 145, completed: 132 },
    { professional: 'Dr. Ricardo Santos', total: 128, completed: 115 },
    { professional: 'Dra. Marina Costa', total: 98, completed: 89 },
    { professional: 'Dr. Paulo Ferreira', total: 72, completed: 62 },
    { professional: 'Dra. Juliana Ramos', total: 42, completed: 22 },
  ],
  byProcedure: [
    { procedure: 'Consulta de Rotina', count: 156 },
    { procedure: 'Limpeza Dental', count: 89 },
    { procedure: 'Retorno', count: 78 },
    { procedure: 'Exames', count: 65 },
    { procedure: 'Tratamento', count: 52 },
    { procedure: 'Pré-Natal', count: 45 },
  ],
};

export const mockPatientSummary: PatientSummary = {
  totalPatients: 1250,
  activePatients: 890,
  newPatientsThisMonth: 45,
  patientsByMonth: [
    { month: 'Jan/2025', newPatients: 45, totalAppointments: 185 },
    { month: 'Dez/2024', newPatients: 38, totalAppointments: 210 },
    { month: 'Nov/2024', newPatients: 52, totalAppointments: 195 },
    { month: 'Out/2024', newPatients: 41, totalAppointments: 178 },
    { month: 'Set/2024', newPatients: 35, totalAppointments: 165 },
    { month: 'Ago/2024', newPatients: 48, totalAppointments: 192 },
  ],
};

export const mockProductivityReports: ProductivityReport[] = [
  {
    professionalId: 'prof1',
    professionalName: 'Dra. Carla Mendes',
    totalAppointments: 145,
    completedAppointments: 132,
    cancelledAppointments: 8,
    revenue: 42500.00,
    averagePerDay: 6.8,
  },
  {
    professionalId: 'prof2',
    professionalName: 'Dr. Ricardo Santos',
    totalAppointments: 128,
    completedAppointments: 115,
    cancelledAppointments: 10,
    revenue: 38200.00,
    averagePerDay: 5.9,
  },
  {
    professionalId: 'prof3',
    professionalName: 'Dra. Marina Costa',
    totalAppointments: 98,
    completedAppointments: 89,
    cancelledAppointments: 5,
    revenue: 28900.00,
    averagePerDay: 4.5,
  },
  {
    professionalId: 'prof4',
    professionalName: 'Dr. Paulo Ferreira',
    totalAppointments: 72,
    completedAppointments: 62,
    cancelledAppointments: 6,
    revenue: 19800.00,
    averagePerDay: 3.2,
  },
  {
    professionalId: 'prof5',
    professionalName: 'Dra. Juliana Ramos',
    totalAppointments: 42,
    completedAppointments: 22,
    cancelledAppointments: 3,
    revenue: 12500.00,
    averagePerDay: 2.1,
  },
];
