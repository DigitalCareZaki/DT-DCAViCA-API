import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const RequirePermission = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);
