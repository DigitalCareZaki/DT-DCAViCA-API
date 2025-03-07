import { Injectable } from '@nestjs/common';
import sgMail = require('@sendgrid/mail');
import { SendMailPayload } from '@types';

// This needs to be done once
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

@Injectable()
export class SendgridService {
  public async sendSgMail({ to, data, templateId }: SendMailPayload): Promise<void> {
    const msg = {
      from: { email: process.env.SENDGRID_EMAIL, name: 'AViCA Team' },
      to,
      templateId,
      dynamicTemplateData: data,
    };

    try {
      const res = await sgMail.send(msg);
      console.log('sgMail.send res ======>>>>', res);
    } catch (err) {
      console.log('sgMail.send error >>>>>>>> ', err);
    }

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
  }
}
