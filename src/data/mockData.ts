import { Project, Task, Material } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Residencial Aurora',
    description: 'Edifício residencial de 15 andares com foco em sustentabilidade.',
    type: 'predio',
    status: 'active',
    progress: 65,
    budget: 12500000,
    spent: 8125000,
    startDate: '2025-01-15',
    endDate: '2026-06-30',
    location: 'Curitiba, PR',
    bimCompliance: true,
    ownerId: 'system',
    createdAt: { seconds: 1705320000, nanoseconds: 0 } as any
  },
  {
    id: '2',
    name: 'Complexo Logístico Nexus',
    description: 'Galpão industrial de alto padrão para e-commerce.',
    type: 'industrial',
    status: 'active',
    progress: 42,
    budget: 45000000,
    spent: 18900000,
    startDate: '2025-03-01',
    endDate: '2026-12-15',
    location: 'Jundiaí, SP',
    bimCompliance: true,
    ownerId: 'system',
    createdAt: { seconds: 1709294400, nanoseconds: 0 } as any
  }
];

export const MOCK_GANTT_TASKS: Task[] = [
  { id: 't1', projectId: '1', name: 'Fundação e Estaqueamento', start: '2025-01-15', end: '2025-03-15', progress: 100, status: 'completed', responsible: 'Eng. Ricardo' },
  { id: 't2', projectId: '1', name: 'Estrutura - Pavimentos Inferiores', start: '2025-03-16', end: '2025-06-30', progress: 85, status: 'in-progress', responsible: 'Eng. Ricardo' },
  { id: 't3', projectId: '1', name: 'Alvenaria e Vedações', start: '2025-07-01', end: '2025-10-30', progress: 10, status: 'delayed', responsible: 'Arq. Marina' },
  { id: 't4', projectId: '1', name: 'Instalações Hidrossanitárias', start: '2025-08-15', end: '2025-12-20', progress: 0, status: 'pending', responsible: 'Eng. Carlos' }
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'm1', name: 'Cimento CP II-32 (50kg)', unit: 'Saco', price: 34.50, category: 'Básico', lastUpdated: '2026-04-01' },
  { id: 'm2', name: 'Aço CA-50 10mm', unit: 'kg', price: 8.90, category: 'Estrutura', lastUpdated: '2026-04-01' },
  { id: 'm3', name: 'Areia Média Lavada', unit: 'm³', price: 125.00, category: 'Básico', lastUpdated: '2026-04-01' },
  { id: 'm4', name: 'Brita nº 1', unit: 'm³', price: 110.00, category: 'Básico', lastUpdated: '2026-04-01' },
  { id: 'm5', name: 'Tijolo Cerâmico 9x19x19', unit: 'Milheiro', price: 850.00, category: 'Vedação', lastUpdated: '2026-04-01' },
  { id: 'm6', name: 'Cal Hidratada (20kg)', unit: 'Saco', price: 18.50, category: 'Básico', lastUpdated: '2026-04-01' },
  { id: 'm7', name: 'Bloco de Concreto 14x19x39', unit: 'Milheiro', price: 3200.00, category: 'Vedação', lastUpdated: '2026-04-01' },
  { id: 'm8', name: 'Argamassa AC-II (20kg)', unit: 'Saco', price: 21.90, category: 'Acabamento', lastUpdated: '2026-04-01' },
  { id: 'm9', name: 'Porcelanato Esmaltado 60x60', unit: 'm²', price: 54.90, category: 'Acabamento', lastUpdated: '2026-04-01' },
  { id: 'm10', name: 'Tinta Acrílica Fosca (18L)', unit: 'Lata', price: 280.00, category: 'Pintura', lastUpdated: '2026-04-01' },
  { id: 'm11', name: 'Tinta Látex PVA (18L)', unit: 'Lata', price: 150.00, category: 'Pintura', lastUpdated: '2026-04-01' },
  { id: 'm12', name: 'Massa Corrida (25kg)', unit: 'Barrica', price: 65.00, category: 'Pintura', lastUpdated: '2026-04-01' },
  { id: 'm13', name: 'Aço CA-60 5.0mm', unit: 'kg', price: 9.50, category: 'Estrutura', lastUpdated: '2026-04-01' },
  { id: 'm14', name: 'Telha Cerâmica Francesa', unit: 'Milheiro', price: 1850.00, category: 'Cobertura', lastUpdated: '2026-04-01' },
  { id: 'm15', name: 'Telha de Fibrocimento 2.44x1.10m', unit: 'Unidade', price: 42.00, category: 'Cobertura', lastUpdated: '2026-04-01' },
  { id: 'm16', name: 'Tubo PVC Água Fria 25mm', unit: 'Barra', price: 18.90, category: 'Hidráulica', lastUpdated: '2026-04-01' },
  { id: 'm17', name: 'Tubo PVC Esgoto 100mm', unit: 'Barra', price: 45.00, category: 'Hidráulica', lastUpdated: '2026-04-01' },
  { id: 'm18', name: 'Joelho PVC 90° 25mm', unit: 'Unidade', price: 1.50, category: 'Hidráulica', lastUpdated: '2026-04-01' },
  { id: 'm19', name: 'Fio de Cobre Flexível 2.5mm', unit: 'Rolo (100m)', price: 145.00, category: 'Elétrica', lastUpdated: '2026-04-01' },
  { id: 'm20', name: 'Disjuntor Termomagnético Bipolar 40A', unit: 'Unidade', price: 38.00, category: 'Elétrica', lastUpdated: '2026-04-01' },
  { id: 'm21', name: 'Tábua de Pinho 30cm (3m)', unit: 'Unidade', price: 28.00, category: 'Madeiramento', lastUpdated: '2026-04-01' },
  { id: 'm22', name: 'Prego 18x27', unit: 'kg', price: 16.50, category: 'Apoio', lastUpdated: '2026-04-01' },
  { id: 'm23', name: 'Impermeabilizante Asfáltico (18L)', unit: 'Balde', price: 185.00, category: 'Impermeabilização', lastUpdated: '2026-04-01' },
  { id: 'm24', name: 'Vaso Sanitário com Caixa Acoplada', unit: 'Unidade', price: 350.00, category: 'Louças/Metais', lastUpdated: '2026-04-01' },
  { id: 'm25', name: 'Concreto Usinado FCK 25MPa', unit: 'm³', price: 380.00, category: 'Estrutura', lastUpdated: '2026-04-01' },
  { id: 'm26', name: 'Pia de Cozinha Inox 1.20m', unit: 'Unidade', price: 195.00, category: 'Louças/Metais', lastUpdated: '2026-04-01' },
  { id: 'm27', name: 'Fechadura Externa Aço Escovado', unit: 'Unidade', price: 120.00, category: 'Esquadrias', lastUpdated: '2026-04-01' },
  { id: 'm28', name: 'Porta de Madeira Pronta 80x210', unit: 'Unidade', price: 450.00, category: 'Esquadrias', lastUpdated: '2026-04-01' },
  { id: 'm29', name: 'Janela de Vidro Temperado 150x120', unit: 'Unidade', price: 580.00, category: 'Esquadrias', lastUpdated: '2026-04-01' },
  { id: 'm30', name: 'Sifão Flexível Multiuso', unit: 'Unidade', price: 12.90, category: 'Hidráulica', lastUpdated: '2026-04-01' },
  { id: 'm31', name: 'Caixa D\'água Polietileno 1000L', unit: 'Unidade', price: 290.00, category: 'Hidráulica', lastUpdated: '2026-04-01' },
  { id: 'm32', name: 'Gesso em Pó (40kg)', unit: 'Saco', price: 25.00, category: 'Básico', lastUpdated: '2026-04-01' },
  { id: 'm33', name: 'Placa de Gesso Acartonado (Drywall) 12.5mm', unit: 'Placa', price: 35.00, category: 'Vedação', lastUpdated: '2026-04-01' },
  { id: 'm34', name: 'Montante para Drywall 70mm x 3m', unit: 'Barra', price: 15.50, category: 'Vedação', lastUpdated: '2026-04-01' },
  { id: 'm35', name: 'Bucha Fischer S8', unit: 'Cento', price: 18.00, category: 'Apoio', lastUpdated: '2026-04-01' },
  { id: 'm36', name: 'Parafuso Philips Madeira 4.0x40', unit: 'Cento', price: 22.00, category: 'Apoio', lastUpdated: '2026-04-01' },
  { id: 'm37', name: 'Eletroduto Corrugado 25mm', unit: 'Rolo (50m)', price: 45.00, category: 'Elétrica', lastUpdated: '2026-04-01' },
  { id: 'm38', name: 'Interruptor Simples com Placa', unit: 'Unidade', price: 14.50, category: 'Elétrica', lastUpdated: '2026-04-01' },
  { id: 'm39', name: 'Tomada Dupla 10A Padrão Novo', unit: 'Unidade', price: 19.90, category: 'Elétrica', lastUpdated: '2026-04-01' },
  { id: 'm40', name: 'Cadeado Latao 35mm', unit: 'Unidade', price: 25.00, category: 'Apoio', lastUpdated: '2026-04-01' },
  { id: 'm41', name: 'Viga de Madeira Cambará 5x15 (3m)', unit: 'Unidade', price: 85.00, category: 'Madeiramento', lastUpdated: '2026-04-01' },
  { id: 'm42', name: 'Lona Plástica Preta 4x50m', unit: 'Rolo', price: 120.00, category: 'Apoio', lastUpdated: '2026-04-01' },
  { id: 'm43', name: 'Fita Crepe Larga 48mmx50m', unit: 'Rolo', price: 11.50, category: 'Pintura', lastUpdated: '2026-04-01' }
];

export function getLocalMockData<T>(key: string, fallback: T[]): T[] {
  const stored = localStorage.getItem(`nexus_mock_${key}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function saveLocalMockData<T>(key: string, data: T[]): void {
  localStorage.setItem(`nexus_mock_${key}`, JSON.stringify(data));
}
