import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UserRes } from '@types';

@Controller('web/emails')
export class EmailsWebController extends EmailsController {
  constructor(emailService: EmailsService) {
    super(emailService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/email-history')
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN, Role.MASTER)
  public async getEmailHistory(@GetUser() user: UserRes) {
    return this.getEmailService().getEmailHistory(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/email-template')
  @RequirePermission(Role.ADMIN, Role.SUPERADMIN)
  public async getEmailTemplate(@GetUser() user: UserRes) {
    return this.getEmailService().getEmailTemplate(user);
  }
}
