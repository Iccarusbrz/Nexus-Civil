import { Timestamp } from 'firebase/firestore';

export type ProjectType = 'predio' | 'casa' | 'comercial' | 'industrial' | 'infraestrutura' | 'rodovias' | 'ruas' | 'outro';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  progress: number;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  location: string;
  bimCompliance: boolean;
  blueprints?: { id: string; name: string; url: string; analysis?: string }[];
  ownerId?: string;
  createdAt?: Timestamp | any;
  history?: { date: string; progress: number }[];
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  start: string; // ISO or YYYY-MM-DD
  end: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  responsible: string;
  dependencies?: string[];
  parentId?: string; // For hierarchical Gantt
}

export interface Material {
  id: string;
  projectId?: string;
  name: string;
  unit: string;
  price: number;
  category: string;
  lastUpdated: string;
}

export interface BDIConfig {
  id: string;
  projectId: string;
  administration: number;
  insurance: number;
  risk: number;
  financial: number;
  profit: number;
  taxes: {
    pis: number;
    cofins: number;
    iss: number;
    cprb: number;
  };
  totalBDI: number;
}

export interface MemorialSection {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
}

export interface DiaryEntry {
  id: string;
  projectId: string;
  date: string;
  weather: {
    morning: 'sunny' | 'cloudy' | 'rainy';
    afternoon: 'sunny' | 'cloudy' | 'rainy';
  };
  manpower: {
    role: string;
    count: number;
  }[];
  equipment: {
    name: string;
    status: 'active' | 'idle' | 'maintenance';
  }[];
  activities: string;
  occurrences: string;
  observations: string;
  photos?: string[];
  isLocked?: boolean;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'engineer' | 'manager' | 'client';
  photoURL?: string;
}
