import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SendgridController } from './sendgrid.controller';
import { SendgridService } from './sendgrid.service';

import { GetUser } from 'src/auth/decorators';

import { MailDTO } from './dto';

import type { UserRes } from '@types';
import type { MailRes } from './types';

@Controller('web/sg-mail')
export class SendgridWebController extends SendgridController {
  constructor(sendGridService: SendgridService) {
    super(sendGridService);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async sendMail(
    @GetUser() user: UserRes,
    @Body() data: MailDTO,
  ): Promise<MailRes> {
    return this.getSendGridService().sendSgMail(user.id, data);
  }
}
