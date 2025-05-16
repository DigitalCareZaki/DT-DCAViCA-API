import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { userSelectFields } from 'src/constant';

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
  public async fetchAllSms() {
    const messages = await this.prisma.sms.findMany({
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