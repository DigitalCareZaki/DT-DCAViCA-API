import type { MeasurementType } from '@prisma/client';

export type Tablet = {
  id: string;
  title: string;
  serial_number: string;
  uri: string | null;
  category: MeasurementType;
  created_by: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
  };
  patient_tablets: PatientTablet[];
  created_at: Date;
  updated_at: Date | null;
};

type PatientTablet = {
  issued_to: {
    user: {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      email: string;
    };
  };
  issued_by: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
  };
  issued_at: Date;
};
