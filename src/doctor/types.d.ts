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

type UserModified = Omit<User, 'password' | 'location_id' | 'organization_id'>;
type LocationModified = Omit<Location, 'city_id'>;
type CityModifed = Omit<City, 'country_id'>;
type PatientModified = Omit<Patient, 'user_id'>;

export type PatientContact = Omit<Contacts, 'updated_at' | 'user_id'>;

export type PatientDoctors = {
  user: {
    email: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    phone_number: string;
  };
  specialities: {
    title: string;
  }[];
  departments: {
    title: string;
  }[];
};

export type PatientNurses = {
  user: {
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
    phone_number: string;
  };
  department: {
    title: string;
  };
};

export type PatientProfile = PatientModified & {
  user: UserModified & {
    location: LocationModified & {
      city: CityModifed & {
        country: Country;
      };
    };
    user_meta_data: UserMetaData[];
  };
};

export type PatientContacts = PatientContact[];

export type ProfileRes = UserModified & {
  doctor: Doctor & {
    specialities: Array<Specialization>;
    departments: Array<Department>;
  };
  location: Location & {
    city: City & {
      country: Country;
    };
  };
};

export type CurrentRes = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  uri: string;
  email: string;
  username: string;
  title: string;
  role: string;
  user_meta_data: {
    ip_address: string;
    device_info: string;
    os: string;
    last_access: Date;
  }[];
};

export type Patients = {
  user: {
    id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    uri: string;
    phone_number: string;
  };
  emr: string;
}[];

export type GetNurses = {
  user: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    id: string;
  };
};

export type OrganizationMedication = {
  id: string;
  name: string;
  organization: {
    id: string;
    name: string;
  };
  created_at: Date;
};

export type DoctorStats = {
  hold: number;
  cancelled: number;
  ongoing: number;
  active: number;
  completed: number;
  pending: number;
};
