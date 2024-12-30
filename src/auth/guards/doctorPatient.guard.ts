import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DoctorPatientGuard implements CanActivate {
  constructor(
    private reflactor: Reflector,
    private prisma: PrismaService,
  ) {}

  public canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user, params } = context.switchToHttp().getRequest();

    return this.isResourceAllowed(user.id, params.id);
  }

  private async isResourceAllowed(
    userId: string,
    patientUserId: string,
  ): Promise<boolean> {
    const data = await this.prisma.patient.findFirst({
      where: {
        AND: [
          {
            doctors: {
              some: {
                user_id: userId,
              },
            },
          },
          {
            user_id: patientUserId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!data) {
      throw new NotFoundException(
        "The resource you're trying to access is not available",
      );
    }

    return true;
  }
}
