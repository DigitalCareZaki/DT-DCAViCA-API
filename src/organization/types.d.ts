import { Gender } from '@prisma/client';
import { UserRole } from '@types';

export type CurrentOrganization = {
  name: string;
  uri: string;
  phone_number: string;
  email: string;
  active: boolean;
};

export type SelectOrganizationBranchesProps = {
  id: string;
  name: string;
};

export type SelectOrganizationDepartmentProps = {
  id: string;
  title: string;
};

export type OrganizationUsers = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone_number: string;
  username: string;
  role: UserRole;
  gender: Gender;
  dob: Date;
  address?: string;
  associated_branches: {
    name: string;
    departments?: {
      id: string;
      title: string;
      description: string | null;
    }[];
  }[];
  patient?: any;
  doctor?: any;
  nurse?: any;
  active?: boolean;
};

export type OrganizationUniqueCheckField = {
  checked: boolean;
  exists: boolean;
  message: string | null;
};

export type OrganizationUniqueCheckResult = {
  available: boolean;
  fields: {
    email: OrganizationUniqueCheckField;
    phone_number: OrganizationUniqueCheckField;
    username: OrganizationUniqueCheckField;
    npi_number: OrganizationUniqueCheckField;
    pmdc_number: OrganizationUniqueCheckField;
  };
};
