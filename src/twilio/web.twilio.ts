import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';

import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';


@Controller('web/sms')
export class TwilioWebController extends TwilioController {
  constructor(twilioService: TwilioService, private prisma: PrismaService) {
    super(twilioService);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  public async sendSMS(@Body() body: { to: string; message: string }) {
    console.log(body, '========>>> body')
    return this.getTwilioService().sendSMS(body.to, body.message);
  }

  @Get('/')
  public async fetchAllSms(@Query('page') page = 1, @Query('limit') limit = 10) {
    const messages = await this.prisma.sms.findMany({
      orderBy: {
        created_at: 'desc',
      }
    });

    return messages;
  }
}