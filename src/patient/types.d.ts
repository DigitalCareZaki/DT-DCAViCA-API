import type {
  Gender,
  Title,
  MedicationUnit,
  MedicationTaken,
  Role,
  VivalinkSyncStatus,
} from '@prisma/client';

export interface ProfileProps {
  first_name: string;
  last_name: string;
  middle_name: string;
  dob: Date;
  uri: string;
  gender: Gender;
  title: Title;
  email: string;
  phone_number: string;
  username: string;
  created_at: Date;
  updated_at: Date;
  patient: {
    emr: string;
    height: number;
    weight: number;
  };
}

export interface PatientMedicationAlert {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  time: Date;
  dosage: string;
  frequency: number;
  unit: MedicationUnit;
  created_at: Date;
  updated_at: Date | null;
  patient_medication_alerts: {
    id: string;
    alert_time: Date;
    taken: MedicationTaken;
  }[];
}

/**
 * Result of Vivalink sync operation
 */
export interface VivalinkSyncResult {
  attempted: boolean;
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

/**
 * Result of patient creation with Vivalink sync status
 */
export interface AddPatientResult {
  success: boolean;
  patientId: string;
  cardiacMonitoring: VivalinkSyncStatus;
  vivalinkSync: VivalinkSyncResult;
}

/**
 * Result of manual Vivalink sync trigger
 */
export interface TriggerVivalinkSyncResult {
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

export interface AssignedCareProvider {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  title: Title;
  role: Role;
  uri: string | null;
}

export interface AssignedCareTeam {
  primary_doctor: AssignedCareProvider | null;
  primary_nurse: AssignedCareProvider | null;
}
