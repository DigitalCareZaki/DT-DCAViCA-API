import type {
  User,
  Doctor,
  Location,
  City,
  Country,
  Specialization,
  Department,
  Patient,
  UserMetaData,
  Contacts,
} from 'prisma/prisma-client';

type UserModified = any;
// Omit<User, 'password' | 'location_id' | 'organization_id'>;
type LocationModified = any;
// Omit<Location, 'city_id'>;
type CityModifed = any;
// Omit<City, 'country_id'>;
type PatientModified = any;
// Omit<Patient, 'user_id'>;

export type PatientContact = any;
// Omit<Contacts, 'updated_at' | 'user_id'>;

export type PatientDoctors = any;
// {
//   user: {
//     email: string;
//     first_name: string;
//     last_name: string;
//     middle_name: string;
//     phone_number: string;
//   };
//   specialities: {
//     title: string;
//   }[];
//   departments: {
//     title: string;
//   }[];
// };

export type PatientNurses = any;
// {
//   user: {
//     first_name: string;
//     last_name: string;
//     middle_name: string;
//     email: string;
//     phone_number: string;
//   };
//   department: {
//     title: string;
//   };
// };

export type PatientProfile = any;
// PatientModified & {
//   user: UserModified & {
//     location: LocationModified & {
//       city: CityModifed & {
//         country: Country;
//       };
//     };
//     user_meta_data: UserMetaData[];
//   };
// };

export type PatientContacts = PatientContact[];

export type ProfileRes = any;
//  UserModified & {
//   doctor: Doctor & {
//     specialities: Array<Specialization>;
//     departments: Array<Department>;
//   };
//   location: Location & {
//     city: City & {
//       country: Country;
//     };
//   };
// };

export type CurrentRes = any;
// {
//   id: string;
//   first_name: string;
//   last_name: string;
//   middle_name: string;
//   uri: string;
//   email: string;
//   username: string;
//   title: string;
//   role: string;
//   user_meta_data: {
//     ip_address: string;
//     device_info: string;
//     os: string;
//     last_access: Date;
//   }[];
// };

export type Patients = any[];
// {
//   user: {
//     id: string;
//     first_name: string;
//     middle_name: string;
//     last_name: string;
//     email: string;
//     uri: string;
//     phone_number: string;
//   };
//   emr: string;
// }[];

export type GetNurses = any;
// {
//   user: {
//     first_name: string;
//     middle_name: string | null;
//     last_name: string;
//     email: string;
//     id: string;
//   };
// };

export type OrganizationMedication = any;
// {
//   id: string;
//   name: string;
//   organization: {
//     id: string;
//     name: string;
//   };
//   created_at: Date;
// };

export type DoctorStats = any;
// {
//   hold: number;
//   cancelled: number;
//   ongoing: number;
//   active: number;
//   completed: number;
//   pending: number;
// };

export type VivalinkSyncResult = {
  attempted: boolean;
  success: boolean;
  message?: string;
  error?: string;
  syncedAt?: Date;
  data?: unknown;
};

export type AddDoctorResult = {
  success: boolean;
  doctorId: string;
  avicardiaMonitoring: string;
  vivalinkSync: VivalinkSyncResult;
};
