import type { MeasurementType } from '@prisma/client';

export type Device = {
  id: string;
  title: string;
  description: string | null;
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
  patient_devices: PatientDevices[];
  created_at: Date;
  updated_at: Date | null;
};

type PatientDevices = {
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
