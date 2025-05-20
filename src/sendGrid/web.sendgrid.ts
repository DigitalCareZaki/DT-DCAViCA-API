import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { SendgridService } from './sendgrid.service';
import type { SendMailPayload } from '@types';

@Controller('web/mail')
export class SendgridWebController {
  constructor(private readonly sendGridService: SendgridService) { }

  @HttpCode(HttpStatus.CREATED)
  @Post('/send')
  public async sendMail(@Body() data: SendMailPayload) {
    return this.sendGridService.sendSgMail(data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/templates')
  public async getTemplates() {
    return this.sendGridService.fetchTemplates();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/template/:id')
  public async getTemplateById(@Param('id') id: string) {
    return this.sendGridService.fetchTemplateById(id);
  }
}
