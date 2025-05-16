import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UserRes } from '@types';
import { JwtGuard } from 'src/auth/guards';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailPayload } from './types';

@Controller('web/emails')
@UseGuards(JwtGuard)
export class EmailsWebController {
  constructor(
    private readonly emailService: EmailsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @HttpCode(HttpStatus.OK)
  @Get('/email-history')
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN, Role.MASTER)
  public async getEmailHistory(@GetUser() user: UserRes) {
    return this.emailService.getEmailHistory(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/email-template')
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN)
  public async getEmailTemplate(@GetUser() user: UserRes) {
    return this.emailService.getEmailTemplate(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/send')
  public async sendEmail() {
    // testing API
    const payload: EmailPayload = {
      to: "shazee257@gmail.com",
      data: {
        name: 'Mr. Shahzad',
      },
      template: 'template:onboarding',
    };

    return this.eventEmitter.emitAsync('send_email', payload);
  }
}
