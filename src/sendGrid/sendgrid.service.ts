import { Injectable } from '@nestjs/common';
import sgMail = require('@sendgrid/mail');
import * as sgClient from '@sendgrid/client';
import { SendMailPayload } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SendgridService {
  constructor(private readonly prisma: PrismaService) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendSgMail({ to, data, templateId }: any): Promise<void> {
    console.log('sendSgMail data >>>>>> ', data);

    const recipientEmail = to;

    // Check if user with this email exists
    const userExists = await this.prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    console.log('userExists >>>>>> ', userExists.id);

    const template = await this.fetchTemplateById(templateId);
    console.log('template >>>>>> ', template);
    if (!template) {
      console.log('Template not found');
      return;
    }

    const msg = {
      from: { email: process.env.SENDGRID_EMAIL, name: 'AViCA Team' },
      to,
      templateId,
      dynamicTemplateData: data,
    };

    try {
      const res = await sgMail.send(msg);
      console.log('sgMail.send res ======>>>>', res);

      await this.prisma.emails.create({
        data: {
          subject: template.versions?.[0].subject,
          to: recipientEmail,
          sended: true,
          html: template.versions?.[0].html_content,
        },
      });
    } catch (err) {
      console.log('sgMail.send error >>>>>>>> ', err);
      await this.prisma.emails.create({
        data: {
          to: recipientEmail,
          sended: false,
          subject: template.versions?.[0].subject,
          html: template.versions?.[0].html_content,
          error: err?.message ?? 'Something went wrong',
        },
      });
    }
  }

  async fetchTemplates() {
    const [response, body] = await sgClient.request({
      method: 'GET',
      url: '/v3/templates?generations=dynamic',
    });

    return body.templates || [];
  }

  async fetchTemplateById(id: string) {
    const [response, body] = await sgClient.request({
      method: 'GET',
      url: `/v3/templates/${id}`,
    });

    return body;
  }
}
