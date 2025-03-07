import { Injectable } from '@nestjs/common';
import sgMail = require('@sendgrid/mail');
import { SendMailPayload } from '@types';

// This needs to be done once
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

@Injectable()
export class SendgridService {
  public async sendSgMail({to, data, templateId}: SendMailPayload): Promise<void> {
    const msg = {
      from: { email: process.env.SENDGRID_EMAIL, name: 'AViCA Team' },
      to,
      templateId,
      dynamicTemplateData: data,
      // dynamicTemplateData: {
      //   'patient-name': data.patientName,
      //   'android-link': 'https://avica-frontend.vercel.app',
      //   'ios-link': 'https://avica-frontend.vercel.app',
      //   'patient-email': data.patientEmail,
      //   'patient-password': data.patientPassword,
      // },
    };

    try {
      const res = await sgMail.send(msg);
      console.log('sgMail.send res ======>>>>', res);
    } catch (err) {
      console.log('sgMail.send error >>>>>>>> ', err);
    }

  // public async sendSgMail(data: any): Promise<MailRes> {
  //   console.log(data, '========>>>payload');

  //   const msg = {
  //     to: data.patientEmail, // Change to your recipient
  //     from: {
  //       email: process.env.SENDGRID_EMAIL,
  //       name: 'AViCA Team',
  //     },
  //     templateId: 'd-615ec8b40a3d4ed18d8090cb02b98aee',
  //     dynamicTemplateData: {
  //       'patient-name': data.patientName,
  //       'android-link': 'https://avica-frontend.vercel.app',
  //       'ios-link': 'https://avica-frontend.vercel.app',
  //       'patient-email': data.patientEmail,
  //       'patient-password': data.patientPassword,
  //     },
  //   };

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
