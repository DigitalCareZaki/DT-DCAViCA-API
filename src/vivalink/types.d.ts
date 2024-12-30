export type VLAllPatients = {
  [key: str]: Array<str>;
};

export type VLSinglePatientECGData = {
  ecg: {
    time: number;
    mv: number;
  }[];
  samplingFrequency: number;
  timePerPoint: number;
};
