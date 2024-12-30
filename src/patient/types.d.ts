import type {
  Gender,
  Title,
  MedicationUnit,
  MedicationTaken,
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
