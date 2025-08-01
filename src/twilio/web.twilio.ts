import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { userSelectFields } from 'src/constant';
import { query } from 'express';

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
  @HttpCode(HttpStatus.CREATED)
  @Get('/')
  public async getAllSms(@Query('page') page = 1, @Query('limit') limit = 10) {

    return this.getTwilioService().getAllSms(+page, +limit);
  }



  @Get('/:patient_id')
  public async fetchPatientSms(@Param('patient_id') patientId: string) {
    const messages = await this.prisma.sms.findMany({
      where: {
        receiver_id: patientId,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        to: true,
        body: true,
        created_at: true,
        sender: { select: userSelectFields },
        receiver: { select: userSelectFields },
      },
    });

    return messages;
  }
}