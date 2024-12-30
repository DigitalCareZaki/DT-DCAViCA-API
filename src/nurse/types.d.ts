import type {
  User,
  Location,
  City,
  Country,
  Department,
  Patient,
  UserMetaData,
  Contacts,
} from 'prisma/prisma-client';

export type { Medication } from 'prisma/prisma-client';

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

export type PatientContacts = {
  user: {
    contacts: PatientContact[];
  };
};

export type ProfileRes = UserModified & {
  nurse: Nurse & {
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
