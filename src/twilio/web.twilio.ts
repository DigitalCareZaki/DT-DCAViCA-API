import { Body, Controller, DefaultValuePipe, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { userSelectFields } from 'src/constant';
import { query } from 'express';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { AdminService } from 'src/admin/admin.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('web/sms')
export class TwilioWebController extends TwilioController {
  constructor(twilioService: TwilioService, private prisma: PrismaService, private adminService: AdminService) {
    super(twilioService);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  public async sendSMS(@Body() body: { to: string; message: string }) {
    console.log(body, '========>>> body')
    return this.getTwilioService().sendSMS(body.to, body.message);
  }
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard)
  @Get('/')
  public async getAllSms(
    @GetUser() user: UserRes,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    console.log(user, '========>>> user in getAllSms')
    const branch = await this.adminService.getBranchId(user.id);
    console.log(branch, '========>>> branch in getAllSms')
    return this.getTwilioService().getAllSms(branch.id, page, limit);
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