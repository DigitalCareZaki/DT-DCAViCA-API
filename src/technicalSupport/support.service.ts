import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { SupportDTO } from './dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  public async generateTechnicalSupportMetaData(data: SupportDTO) {
    const message = `The following user has issues: ${data.email}\n\n
    
    Issue faced:\n

    Forgot Password: ${data.forgot_password ? 'YES' : 'NO'}\n
    Can not signin/signup: ${data.not_signing_up ? 'YES' : 'NO'}\n
    Can not find something/anything: ${data.can_not_find_anything ? 'YES' : 'NO'}\n
    Showing errors: ${data.showing_errors ? 'YES' : 'NO'}\n
    Others: ${data.others ? 'YES' : 'NO'}\n
    
    \n\n
    Their message:\n

    ${data.textarea}`;

    const master = await this.prisma.user.findFirstOrThrow({
      where: {
        role: 'MASTER',
      },
      select: {
        id: true,
      },
    });

    // TODO: Send to relevant superadmin
    const superAdmin = await this.prisma.user.findFirstOrThrow({
      where: {
        role: 'SUPERADMIN',
      },
      select: {
        email: true,
      },
    });

    return [master.id, superAdmin.email, message];
  }
}
