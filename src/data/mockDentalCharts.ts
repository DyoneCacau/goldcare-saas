import { DentalChart, ToothRecord, ADULT_TEETH } from '@/types/dental';

// Generate default healthy teeth
const generateDefaultTeeth = (): Record<number, ToothRecord> => {
  const teeth: Record<number, ToothRecord> = {};
  const allTeeth = [
    ...ADULT_TEETH.upperRight,
    ...ADULT_TEETH.upperLeft,
    ...ADULT_TEETH.lowerLeft,
    ...ADULT_TEETH.lowerRight,
  ];
  
  allTeeth.forEach((num) => {
    teeth[num] = {
      number: num,
      status: 'healthy',
      procedures: [],
    };
  });
  
  return teeth;
};

export const mockDentalCharts: Record<string, DentalChart> = {
  '1': {
    patientId: '1',
    lastUpdate: '2025-01-20',
    teeth: {
      ...generateDefaultTeeth(),
      // Custom teeth status for patient 1
      16: {
        number: 16,
        status: 'treated',
        procedures: [
          {
            id: 'p1',
            date: '2024-11-15',
            procedure: 'Restauração',
            professional: 'Dra. Marina Costa',
            status: 'completed',
            notes: 'Restauração em resina composta',
          },
        ],
      },
      26: {
        number: 26,
        status: 'cavity',
        procedures: [
          {
            id: 'p2',
            date: '2025-01-25',
            procedure: 'Restauração',
            professional: 'Dra. Marina Costa',
            status: 'scheduled',
          },
        ],
      },
      36: {
        number: 36,
        status: 'root_canal',
        procedures: [
          {
            id: 'p3',
            date: '2024-09-10',
            procedure: 'Tratamento de Canal',
            professional: 'Dr. Felipe Odonto',
            status: 'completed',
          },
        ],
      },
      46: {
        number: 46,
        status: 'pending',
        procedures: [
          {
            id: 'p4',
            date: '2025-02-01',
            procedure: 'Limpeza profunda',
            professional: 'Dra. Marina Costa',
            status: 'pending',
          },
        ],
      },
    },
    generalNotes: 'Paciente com sensibilidade em região de molares. Recomendado pasta para sensibilidade.',
  },
  '2': {
    patientId: '2',
    lastUpdate: '2025-01-18',
    teeth: {
      ...generateDefaultTeeth(),
      18: {
        number: 18,
        status: 'extracted',
        procedures: [
          {
            id: 'p5',
            date: '2024-06-20',
            procedure: 'Extração',
            professional: 'Dr. Felipe Odonto',
            status: 'completed',
            notes: 'Extração por indicação ortodôntica',
          },
        ],
      },
      28: {
        number: 28,
        status: 'extracted',
        procedures: [
          {
            id: 'p6',
            date: '2024-06-20',
            procedure: 'Extração',
            professional: 'Dr. Felipe Odonto',
            status: 'completed',
          },
        ],
      },
      11: {
        number: 11,
        status: 'treated',
        procedures: [
          {
            id: 'p7',
            date: '2024-12-10',
            procedure: 'Clareamento',
            professional: 'Dra. Marina Costa',
            status: 'completed',
          },
        ],
      },
      21: {
        number: 21,
        status: 'treated',
        procedures: [
          {
            id: 'p8',
            date: '2024-12-10',
            procedure: 'Clareamento',
            professional: 'Dra. Marina Costa',
            status: 'completed',
          },
        ],
      },
    },
  },
  '3': {
    patientId: '3',
    lastUpdate: '2025-01-10',
    teeth: {
      ...generateDefaultTeeth(),
      37: {
        number: 37,
        status: 'implant',
        procedures: [
          {
            id: 'p9',
            date: '2024-03-15',
            procedure: 'Implante',
            professional: 'Dr. Ricardo Santos',
            status: 'completed',
            notes: 'Implante osteointegrado',
          },
        ],
      },
      47: {
        number: 47,
        status: 'prosthesis',
        procedures: [
          {
            id: 'p10',
            date: '2024-05-20',
            procedure: 'Coroa',
            professional: 'Dr. Ricardo Santos',
            status: 'completed',
          },
        ],
      },
    },
  },
};

// Generate empty chart for patients without dental records
export const generateEmptyDentalChart = (patientId: string): DentalChart => ({
  patientId,
  lastUpdate: new Date().toISOString().split('T')[0],
  teeth: generateDefaultTeeth(),
});
