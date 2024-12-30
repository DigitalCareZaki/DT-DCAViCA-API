export type UserRes = {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  username: string;
  role: UserRole;
  organization_id: string;
  isPincode: boolean;
};

export type JsonRes = {
  status: 'success' | 'failed' | 'pending';
  message: string;
};

export type UserRole =
  | 'MASTER'
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'PATIENT';
