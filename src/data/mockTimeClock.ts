import { TimeClockEntry } from '@/types/timeclock';
import { mockProfessionals } from './mockAgenda';
import { mockStaffMembers } from './mockCommissions';

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getDateOffset = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

// All employees (professionals + staff)
export const mockEmployees = [
  ...mockProfessionals.map(p => ({
    id: p.id,
    name: p.name,
    role: 'professional' as const,
    clinicId: 'clinic1',
  })),
  ...mockStaffMembers.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role as 'reception' | 'seller',
    clinicId: s.clinicId,
  })),
];

export const mockTimeClockEntries: TimeClockEntry[] = [
  // Today's entries
  {
    id: 'tc1',
    userId: 'prof1',
    userName: 'Dr. Carlos Oliveira',
    userRole: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(0),
    clockIn: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    status: 'working',
  },
  {
    id: 'tc2',
    userId: 'staff1',
    userName: 'Ana Souza',
    userRole: 'reception',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(0),
    clockIn: '07:45',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    status: 'working',
  },
  {
    id: 'tc3',
    userId: 'staff2',
    userName: 'Carlos Vendas',
    userRole: 'seller',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(0),
    clockIn: '09:00',
    status: 'working',
  },
  // Yesterday's entries (completed)
  {
    id: 'tc4',
    userId: 'prof1',
    userName: 'Dr. Carlos Oliveira',
    userRole: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(-1),
    clockIn: '08:05',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    clockOut: '18:00',
    totalHours: 8.92,
    status: 'completed',
  },
  {
    id: 'tc5',
    userId: 'staff1',
    userName: 'Ana Souza',
    userRole: 'reception',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(-1),
    clockIn: '07:50',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    clockOut: '18:00',
    totalHours: 9.17,
    status: 'completed',
  },
  {
    id: 'tc6',
    userId: 'prof2',
    userName: 'Dra. Ana Costa',
    userRole: 'professional',
    clinicId: 'clinic2',
    clinicName: 'Sorriso Perfeito Odontologia',
    date: getDateOffset(-1),
    clockIn: '09:00',
    lunchStart: '12:30',
    lunchEnd: '13:30',
    clockOut: '18:30',
    totalHours: 8.5,
    status: 'completed',
  },
  // 2 days ago
  {
    id: 'tc7',
    userId: 'prof1',
    userName: 'Dr. Carlos Oliveira',
    userRole: 'professional',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(-2),
    clockIn: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    clockOut: '18:00',
    totalHours: 9,
    status: 'completed',
  },
  {
    id: 'tc8',
    userId: 'staff2',
    userName: 'Carlos Vendas',
    userRole: 'seller',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(-2),
    clockIn: '09:15',
    lunchStart: '12:30',
    lunchEnd: '13:30',
    clockOut: '18:00',
    totalHours: 7.75,
    status: 'completed',
    notes: 'Chegou atrasado - trânsito',
  },
  // 3 days ago
  {
    id: 'tc9',
    userId: 'prof3',
    userName: 'Dra. Carla Mendes',
    userRole: 'professional',
    clinicId: 'clinic3',
    clinicName: 'Centro Odontológico Jardins',
    date: getDateOffset(-3),
    clockIn: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    clockOut: '17:30',
    totalHours: 8.5,
    status: 'completed',
  },
  {
    id: 'tc10',
    userId: 'staff1',
    userName: 'Ana Souza',
    userRole: 'reception',
    clinicId: 'clinic1',
    clinicName: 'Odonto Premium Centro',
    date: getDateOffset(-3),
    clockIn: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    clockOut: '18:00',
    totalHours: 9,
    status: 'completed',
  },
];

// Helper function to calculate total hours
export function calculateTotalHours(entry: TimeClockEntry): number {
  if (!entry.clockOut) return 0;
  
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };
  
  const clockInTime = parseTime(entry.clockIn);
  const clockOutTime = parseTime(entry.clockOut);
  let totalHours = clockOutTime - clockInTime;
  
  // Subtract lunch break if present
  if (entry.lunchStart && entry.lunchEnd) {
    const lunchStart = parseTime(entry.lunchStart);
    const lunchEnd = parseTime(entry.lunchEnd);
    totalHours -= (lunchEnd - lunchStart);
  }
  
  return Math.round(totalHours * 100) / 100;
}
