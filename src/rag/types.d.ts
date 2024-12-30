type PatientRagValue = {
  high: number;
  normal: number;
  low: number;
  pending: number;
};

export type PatientRag = {
  start_date: string | null;
  end_date: string | null;

  ecg: PatientRagValue;
  spo2: PatientRagValue;
  bloodpressure: PatientRagValue;
  bloodglucose: PatientRagValue;
  temperature: PatientRagValue;
};
