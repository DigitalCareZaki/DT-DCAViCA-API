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
  associated_branches: {
    name: string;
  }[];
};
