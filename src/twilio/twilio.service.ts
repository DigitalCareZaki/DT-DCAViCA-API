import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

// This needs to be done once

@Injectable()
export class TwilioService {
  private client: Twilio.Twilio;
  constructor(private configService: ConfigService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not provided');
    }

    this.client = Twilio(accountSid, authToken);
  }

  public async sendSMS(to: string, body: string): Promise<any> {
    try {
      const message = await this.client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      console.log('message', message);
      return message;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}
