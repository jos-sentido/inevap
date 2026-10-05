
export enum UserRole {
  ALUMNO = 'ALUMNO',
  ADMIN = 'ADMIN'
}

export enum StageStatus {
  LOCKED = 'LOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Stage {
  id: number;
  title: string;
  description: string;
  status: StageStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  curp: string;
  role: UserRole;
  currentStage: number;
  licenciatura?: string;
}

export interface Guide {
  licenciatura: string;
  content: string;
  lastUpdated: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
