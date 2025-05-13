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
  @Post('/send')
  public async sendSMS(@Body() body: { to: string; message: string }) {
    console.log(body, '========>>> body')
    return this.getTwilioService().sendSMS(body.to, body.message);
  }

  @Get('/logs')
  public async fetchAllSmsLogs(@Query('page') page = 1, @Query('limit') limit = 10) {
    const skip = ((+page) - 1) * (+limit);
    const take = +limit;

    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.smsLog.findMany({
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.smsLog.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: logs,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };

  }
}