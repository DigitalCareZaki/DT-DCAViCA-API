import { Role } from '@prisma/client';

export const userRoles: Role[] = [
  'ADMIN',
  'DOCTOR',
  'MASTER',
  'NURSE',
  'PATIENT',
  'SUPERADMIN',
];

export const allowedQueryRoles: Role[] = [
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'PATIENT',
];
