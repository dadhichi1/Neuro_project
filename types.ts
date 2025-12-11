
export enum UserRole {
  PATIENT = 'PATIENT',
  CLINICIAN = 'CLINICIAN'
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  targetReps: number;
  targetSets: number;
  difficulty: 'Low' | 'Medium' | 'High';
  focusArea: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  exercises: Exercise[];
  rationale: string; // AI generated rationale
  focus: string;
  status: 'pending' | 'completed' | 'skipped';
}

export interface SessionLog {
  id: string;
  date: string;
  painLevelStart: number;
  painLevelEnd: number;
  completionRate: number;
  aiNotes: string;
  flaggedIssues: string[];
}

export interface RecoveryStage {
  level: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  progress: number; // 0-100
  criteria: string;
  unlocks: string; // The "Why" - e.g. "Unlocks: Independent Stair Climbing"
}

export interface PatientProfile {
  name: string;
  injury: string;
  startDate: string;
  currentPhase: string;
  level: number;
  xp: number;
  streak: number;
}
