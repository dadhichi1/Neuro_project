
import { PatientProfile, SessionLog, DailyPlan, RecoveryStage } from './types';

export const MOCK_PROFILE: PatientProfile = {
  name: "Alex Mercer",
  injury: "Post-Traumatic TBI & Right Hemiparesis",
  startDate: "2025-01-15",
  currentPhase: "Motor Control & Gait Stability",
  level: 3,
  xp: 850,
  streak: 12
};

export const RECOVERY_JOURNEY: RecoveryStage[] = [
  {
    level: 1,
    name: "Passive Mobility",
    description: "Restoring basic joint range of motion.",
    status: 'completed',
    progress: 100,
    criteria: "Full passive range in shoulder/knee",
    unlocks: "Assisted Movement"
  },
  {
    level: 2,
    name: "Active Assisted",
    description: "Moving limbs with partial support.",
    status: 'completed',
    progress: 100,
    criteria: "Move limb against gravity (10s hold)",
    unlocks: "Independent Movement"
  },
  {
    level: 3,
    name: "Motor Control",
    description: "Smoothing out jerky movements and basic balance.",
    status: 'current',
    progress: 78,
    criteria: "90% Accuracy on Seated Rotations",
    unlocks: "Strength Training & Resistance"
  },
  {
    level: 4,
    name: "Strength & Load",
    description: "Building muscle to support weight bearing.",
    status: 'locked',
    progress: 0,
    criteria: "3x10 Sit-to-Stands without hands",
    unlocks: "Independent Walking (No Cane)"
  },
  {
    level: 5,
    name: "Functional Life",
    description: "Complex movements for daily living.",
    status: 'locked',
    progress: 0,
    criteria: "Climb 1 flight of stairs",
    unlocks: "Driving & Return to Work"
  }
];

export const MOCK_HISTORY: SessionLog[] = [
  {
    id: '1',
    date: '2025-05-10',
    painLevelStart: 3,
    painLevelEnd: 5,
    completionRate: 85,
    aiNotes: "Good stability in standing. Slight tremor in right hand during fine motor tasks.",
    flaggedIssues: ["Right wrist fatigue"]
  },
  {
    id: '2',
    date: '2025-05-11',
    painLevelStart: 4,
    painLevelEnd: 4,
    completionRate: 90,
    aiNotes: "Improved gait symmetry. Maintained balance during closed-eye drills.",
    flaggedIssues: []
  },
  {
    id: '3',
    date: '2025-05-12',
    painLevelStart: 2,
    painLevelEnd: 6,
    completionRate: 60,
    aiNotes: "Session terminated early due to reported lumbar pain. Compensatory leaning observed.",
    flaggedIssues: ["Lumbar compensation", "Early fatigue"]
  },
  {
    id: '4',
    date: '2025-05-13',
    painLevelStart: 3,
    painLevelEnd: 3,
    completionRate: 95,
    aiNotes: "Excellent recovery session. Lower intensity helped reset pain baseline.",
    flaggedIssues: []
  },
  {
    id: '5',
    date: '2025-05-14',
    painLevelStart: 3,
    painLevelEnd: 4,
    completionRate: 88,
    aiNotes: "Introduction of resistance bands successful. Form held for 80% of reps.",
    flaggedIssues: ["Left shoulder hiking"]
  }
];

export const INITIAL_PLAN: DailyPlan = {
  id: 'today',
  date: new Date().toISOString().split('T')[0],
  status: 'pending',
  focus: "Core Stability & Right Arm Reach",
  rationale: "Based on yesterday's success with resistance bands, we are increasing hold times but keeping reps static to avoid fatigue accumulation.",
  exercises: [
    {
      id: 'e1',
      name: "Seated Trunk Rotations",
      description: "Slow rotation with eyes following hands.",
      targetReps: 10,
      targetSets: 3,
      difficulty: 'Low',
      focusArea: "Core"
    },
    {
      id: 'e2',
      name: "Supported Forward Reach",
      description: "Reach towards target object on table, maintain upright posture.",
      targetReps: 12,
      targetSets: 3,
      difficulty: 'Medium',
      focusArea: "Right Upper Extremity"
    },
    {
      id: 'e3',
      name: "Sit-to-Stand",
      description: "Rise from chair without using hands if possible.",
      targetReps: 8,
      targetSets: 2,
      difficulty: 'High',
      focusArea: "Lower Body / Balance"
    }
  ]
};
