import type { MeasurementType } from '@prisma/client';

export type PatientReadingRangeAlert = {
  id: string;

  type: MeasurementType;

  range: Array<number>;

  send_sms: boolean;
  send_email: boolean;

  user: {
    id: string;
    first_name: string;
    middle_name: string | null;
    middle_name: string;
    email: string;
  };

  patient: {
    user: {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      email: string;
    };
  };

  created_at: Date;
  updated_at: Date | null;
};
