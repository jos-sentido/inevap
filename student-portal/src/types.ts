
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

export interface ProfessionalProfile {
  yearsExp: string;
  currentRole: string;
  industry: string;
}

export interface Ghl {
  contactId?: string;
  opportunityId?: string;
  pipelineId?: string;
  stageId?: string;
}

/** Documento `users/{uid}` en Firestore. */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  curp?: string;
  role: UserRole;
  licenciatura?: string;
  currentStage: number;
  stageStatus?: Record<string, StageStatus>;
  professionalProfile?: ProfessionalProfile;
  ghl?: Ghl;
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
