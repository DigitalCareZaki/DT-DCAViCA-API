export type PatientCompliance = {
  [key: string]: {
    total: number;
    taken: number;
    not_taken: number;
  };
};

export type PatientCompliancePerPill = {
  user: {
    id: string;
  };
  medications: Array<{
    id: string;
    name: string;
    compliance: PatientCompliance;
  }>;
};
