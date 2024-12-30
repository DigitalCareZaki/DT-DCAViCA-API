export interface GetEMRRecords {
  title: string;
  uri: string;
  created: string;
  family_history: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
      middle_name: string;
      uri: string;
      id: string;
    };
  };
}
