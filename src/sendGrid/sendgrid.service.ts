import { Injectable } from '@nestjs/common';

import sgMail = require('@sendgrid/mail');

import { MailDTO } from './dto';

import type { MailRes } from './types';

// This needs to be done once
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

@Injectable()
export class SendgridService {
  constructor() {}

  public async sendSgMail(userId: string, data: MailDTO): Promise<MailRes> {
    const message = {
      to: data.to,
      cc: [],
      bcc: [],
      from: {
        name: 'Avica',
        email: process.env.SENDGRID_EMAIL,
      },
      replyTo: null,
      subject: data.subject,
      html: data.content,
      attachments: [],
    };

    try {
      await sgMail.send(message);

      return {
        sent: true,
      };
    } catch (err) {
      return {
        sent: false,
      };
    }
  }
}
