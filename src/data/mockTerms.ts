import { ConsentTerm, ClinicBranding, SignedTerm } from '@/types/terms';

export const mockClinicBranding: ClinicBranding[] = [
  {
    clinicId: 'clinic1',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&h=200&fit=crop',
    headerText: 'Clínica Central São Paulo - Excelência em Saúde',
    footerText: 'CNPJ: 12.345.678/0001-00 | Av. Paulista, 1000, 5º andar - Bela Vista, São Paulo - SP',
    primaryColor: '#0ea5e9',
  },
  {
    clinicId: 'clinic2',
    logo: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200&h=200&fit=crop',
    headerText: 'Consultório Odontológico Sorriso - Seu Sorriso é Nossa Prioridade',
    footerText: 'CNPJ: 98.765.432/0001-00 | Rua Augusta, 500, Sala 12 - Consolação, São Paulo - SP',
    primaryColor: '#10b981',
  },
  {
    clinicId: 'clinic3',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
    headerText: 'Centro Médico Jardins - Cuidado Integral',
    footerText: 'CNPJ: 45.678.901/0001-00 | Alameda Santos, 800 - Jardins, São Paulo - SP',
    primaryColor: '#8b5cf6',
  },
];

export const mockConsentTerms: ConsentTerm[] = [
  {
    id: 'term1',
    clinicId: 'clinic1',
    title: 'Termo de Consentimento para Tratamento',
    type: 'consent',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Eu, abaixo assinado(a), declaro que fui devidamente informado(a) sobre:

1. O diagnóstico e a natureza do tratamento proposto;
2. Os procedimentos que serão realizados;
3. Os riscos e benefícios do tratamento;
4. As alternativas de tratamento disponíveis;
5. As possíveis consequências da não realização do tratamento.

Declaro ainda que:
- Tive a oportunidade de fazer perguntas e todas foram respondidas satisfatoriamente;
- Compreendo que posso revogar este consentimento a qualquer momento, sem qualquer prejuízo ao meu atendimento;
- Autorizo a realização do tratamento proposto.

Este termo foi lido e explicado ao paciente/responsável antes da assinatura.`,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-06-15',
  },
  {
    id: 'term2',
    clinicId: 'clinic1',
    title: 'Termo de Ciência - Procedimentos e Riscos',
    type: 'awareness',
    content: `TERMO DE CIÊNCIA

Declaro estar ciente de que:

1. Todo procedimento médico/odontológico pode apresentar riscos inerentes;
2. Os resultados esperados não podem ser garantidos;
3. O sucesso do tratamento depende também da colaboração do paciente;
4. Devo seguir todas as orientações pós-procedimento fornecidas pela equipe;
5. Em caso de dúvidas ou complicações, devo entrar em contato imediatamente com a clínica.

ORIENTAÇÕES GERAIS:
- Comparecer pontualmente às consultas agendadas;
- Informar sobre qualquer medicamento em uso;
- Comunicar alergias ou reações adversas conhecidas;
- Seguir as recomendações de cuidados domiciliares.`,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-06-15',
  },
  {
    id: 'term3',
    clinicId: 'clinic2',
    title: 'Termo de Consentimento Odontológico',
    type: 'consent',
    content: `TERMO DE CONSENTIMENTO PARA TRATAMENTO ODONTOLÓGICO

Eu, paciente ou responsável legal, autorizo o profissional a realizar os procedimentos odontológicos necessários para o meu tratamento.

DECLARO QUE:
1. Fui informado(a) sobre o diagnóstico e plano de tratamento;
2. Compreendo os procedimentos que serão realizados;
3. Estou ciente dos riscos e benefícios envolvidos;
4. Tive todas as minhas dúvidas esclarecidas;
5. Autorizo a utilização de anestesia local quando necessário;
6. Autorizo a realização de radiografias e outros exames diagnósticos.

COMPROMETO-ME A:
- Seguir as orientações pós-operatórias;
- Comparecer aos retornos agendados;
- Comunicar qualquer alteração ou desconforto.`,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-07-01',
  },
  {
    id: 'term4',
    clinicId: 'clinic2',
    title: 'Autorização para Uso de Imagem',
    type: 'authorization',
    content: `TERMO DE AUTORIZAÇÃO PARA USO DE IMAGEM

Autorizo o uso de fotografias, radiografias e demais imagens do meu tratamento para:

( ) Fins didáticos e científicos
( ) Publicação em trabalhos acadêmicos
( ) Divulgação em redes sociais da clínica
( ) Apresentação em congressos e eventos

Estou ciente de que:
- Minha identidade será preservada;
- Não haverá qualquer tipo de remuneração;
- Esta autorização pode ser revogada a qualquer momento por escrito.`,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-07-01',
  },
  {
    id: 'term5',
    clinicId: 'clinic3',
    title: 'Termo de Responsabilidade - Gestante',
    type: 'treatment',
    content: `TERMO DE RESPONSABILIDADE - ACOMPANHAMENTO PRÉ-NATAL

Declaro que fui orientada sobre a importância do acompanhamento pré-natal e me comprometo a:

1. Comparecer a todas as consultas agendadas;
2. Realizar todos os exames solicitados;
3. Seguir as orientações médicas e nutricionais;
4. Comunicar imediatamente qualquer sintoma ou alteração;
5. Manter os dados de contato atualizados.

Estou ciente de que o não comparecimento às consultas ou a não realização dos exames pode comprometer a saúde da gestante e do bebê.

Em caso de emergência, autorizo a realização de procedimentos necessários para preservar a vida e a saúde.`,
    isActive: true,
    createdAt: '2024-03-01',
    updatedAt: '2024-08-01',
  },
];

export const mockSignedTerms: SignedTerm[] = [
  {
    id: 'signed1',
    termId: 'term1',
    patientId: '1',
    patientName: 'Maria da Silva',
    signedAt: '2025-01-20T09:30:00',
    signedBy: 'Ana Recepcionista',
    clinicId: 'clinic1',
  },
  {
    id: 'signed2',
    termId: 'term2',
    patientId: '1',
    patientName: 'Maria da Silva',
    signedAt: '2025-01-20T09:32:00',
    signedBy: 'Ana Recepcionista',
    clinicId: 'clinic1',
  },
  {
    id: 'signed3',
    termId: 'term3',
    patientId: '3',
    patientName: 'Pedro Almeida',
    signedAt: '2025-01-10T16:15:00',
    signedBy: 'Carla Recepcionista',
    clinicId: 'clinic2',
  },
];
