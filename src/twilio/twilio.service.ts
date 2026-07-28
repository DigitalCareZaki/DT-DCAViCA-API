// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as Twilio from 'twilio';

// // This needs to be done once

// @Injectable()
// export class TwilioService {
//   private client: Twilio.Twilio;
//   constructor(private configService: ConfigService) {
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;

//     if (!accountSid || !authToken) {
//       throw new Error('Twilio credentials not provided');
//     }

//     this.client = Twilio(accountSid, authToken);
//   }

//   public async sendSMS(to: string, body: string): Promise<any> {
//     try {
//       const message = await this.client.messages.create({
//         body,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to,
//       });
//       console.log('message', message);
//       return message;
//     } catch (error) {
//       console.error('Error sending SMS:', error);
//       throw error;
//     }
//   }
// }
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as Twilio from 'twilio';
import { userSelectFields } from 'src/constant';
import type { PaginatedResult } from '@types';

@Injectable()
export class TwilioService {

  private client: Twilio.Twilio;
  private from: string;

  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !this.from) {
      throw new Error('Twilio credentials are not provided');
    }

    this.client = new Twilio.Twilio(accountSid, authToken);
  }

  public async sendSMS(to: string, body: string): Promise<any> {
    try {
      const message = await this.client.messages.create({ body, from: this.from, to });
      console.log('Message sent:', message.sid);
      return message;
    } catch (error: any) {
      console.error('Error sending SMS:', error.message);
      throw new BadRequestException(error.message);
    }
  }

  public async getAllSms(branchId: string, page: number, limit: number): Promise<PaginatedResult<any>> {
    // for admin only
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
    const requestedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

    const where = {
      OR: [
        {
          sender: {
            associated_branches: {
              some: {
                id: branchId,
              },
            },
          },
        },
        {
          receiver: {
            associated_branches: {
              some: {
                id: branchId,
              },
            },
          },
        },
      ],
    };
    const totalItems = await this.prisma.sms.count({ where });
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / safeLimit) : 0;
    const currentPage = totalPages > 0
      ? Math.min(Math.max(requestedPage, 1), totalPages)
      : 1;
    const skip = (currentPage - 1) * safeLimit;

    const messages = await this.prisma.sms.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [
        {
          created_at: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      select: {
        id: true,
        to: true,
        body: true,
        created_at: true,
        sender: { select: userSelectFields },
        receiver: { select: userSelectFields },
      },
    });

    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    return {
      data: messages,
      pagination: {
        totalItems,
        perPage: safeLimit,
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? currentPage + 1 : null,
        prevPage: hasPrevPage ? currentPage - 1 : null,
      },
    };
  }
}

