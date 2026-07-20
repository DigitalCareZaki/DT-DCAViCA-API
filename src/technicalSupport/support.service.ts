import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { SupportDTO } from './dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) { }

  public async generateTechnicalSupportMetaData(data: SupportDTO): Promise<[string, string[], string]> {
    const message = `The following user has issues: ${data.email}

Issue faced:

Forgot Password: ${data.forgot_password ? 'YES' : 'NO'}
Can not signin/signup: ${data.not_signing_up ? 'YES' : 'NO'}
Can not find something/anything: ${data.can_not_find_anything ? 'YES' : 'NO'}
Showing errors: ${data.showing_errors ? 'YES' : 'NO'}
Others: ${data.others ? 'YES' : 'NO'}

Their message:

${data.textarea}`;

    const master = await this.prisma.user.findFirstOrThrow({
      where: {
        role: 'MASTER',
      },
      select: {
        id: true,
      },
    });

    // Find the user who submitted the support request
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        email: data.email,
      },
      select: {
        organization_id: true,
        associated_branches: {
          select: {
            id: true,
          },
        },
      },
    });

    const organizationId = user.organization_id;
    const branchId = user.associated_branches[0]?.id;

    // Branch Admin
    const branchAdmin = await this.prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        associated_branches: {
          some: {
            id: branchId,
          },
        },
      },
      select: {
        email: true,
      },
    });

    // Organization Super Admin
    const superAdmin = await this.prisma.user.findFirst({
      where: {
        role: 'SUPERADMIN',
        organization_id: organizationId,
      },
      select: {
        email: true,
      },
    });

    return [
      master.id,
      [branchAdmin?.email, superAdmin?.email].filter(
        (email): email is string => Boolean(email),
      ),
      message,
    ];
  }
  // public async generateTechnicalSupportMetaData(data: SupportDTO) {
  //   const message = `The following user has issues: ${data.email}\n\n

  //   Issue faced:\n

  //   Forgot Password: ${data.forgot_password ? 'YES' : 'NO'}\n
  //   Can not signin/signup: ${data.not_signing_up ? 'YES' : 'NO'}\n
  //   Can not find something/anything: ${data.can_not_find_anything ? 'YES' : 'NO'}\n
  //   Showing errors: ${data.showing_errors ? 'YES' : 'NO'}\n
  //   Others: ${data.others ? 'YES' : 'NO'}\n

  //   \n\n
  //   Their message:\n

  //   ${data.textarea}`;

  //   const master = await this.prisma.user.findFirstOrThrow({
  //     where: {
  //       role: 'MASTER',
  //     },
  //     select: {
  //       id: true,
  //     },
  //   });

  //   // TODO: Send to relevant superadmin
  //   const superAdmin = await this.prisma.user.findFirstOrThrow({
  //     where: {
  //       role: 'SUPERADMIN',
  //     },
  //     select: {
  //       email: true,
  //     },
  //   });

  //   return [master.id, superAdmin.email, message];
  // }
}
