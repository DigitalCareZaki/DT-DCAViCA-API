import { Injectable } from '@nestjs/common';

import sgMail = require('@sendgrid/mail');

import { MailDTO } from './dto';

import type { MailRes } from './types';

// This needs to be done once
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

@Injectable()
export class SendgridService {
  constructor() {}

  public async sendSgMail(data: any): Promise<MailRes> {
    console.log(data, '========>>>payload');

    const msg = {
      to: data.patientEmail, // Change to your recipient
      from: {
        email: process.env.SENDGRID_EMAIL,
        name: 'AViCA Team',
      },
      templateId: 'd-615ec8b40a3d4ed18d8090cb02b98aee',
      dynamicTemplateData: {
        'patient-name': data.patientName,
        'android-link': 'https://avica-frontend.vercel.app',
        'ios-link': 'https://avica-frontend.vercel.app',
        'patient-email': data.patientEmail,
        'patient-password': data.patientPassword,
      },
    };

    // const message = {
    //   to: data.to,
    //   cc: [],
    //   bcc: [],
    //   from: {
    //     name: 'Avica',
    //     email: process.env.SENDGRID_EMAIL,
    //   },
    //   replyTo: process.env.SENDGRID_EMAIL,
    //   subject: data.subject,
    //   html: data.content,
    //   attachments: [],
    // };

    try {
      const res = await sgMail.send(msg);
      return {
        sent: true,
      };
    } catch (err) {
      console.log(err, '=======>>>err');
      return {
        sent: false,
      };
    }
  }
}
