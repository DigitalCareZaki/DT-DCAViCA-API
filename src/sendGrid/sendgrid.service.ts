import { Injectable } from '@nestjs/common';
import sgMail = require('@sendgrid/mail');
import * as sgClient from '@sendgrid/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SendgridService {
  constructor(private readonly prisma: PrismaService) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendSgMail({ to, data, templateId }: any): Promise<void> {
    const recipientEmail = typeof to === 'string' ? [to] : to;
    console.log('recipientEmail >>>>>> ', recipientEmail);
    // Check if user with this email exists

    const template = await this.fetchTemplateById(templateId);

    if (!template) {
      console.log('Template not found');
      return;
    }

    const rawHtml = template.versions?.[0].html_content || '';
    const renderedHtml = this.renderDynamicTemplate(rawHtml, data);

    const msg = {
      from: { email: process.env.SENDGRID_EMAIL, name: 'AViCA Team' },
      to,
      templateId,
      dynamicTemplateData: data,
    };

    try {
      const res = await sgMail.send(msg);
      console.log('sgMail.send res ======>>>>', JSON.stringify(res, null, 2));

      await this.prisma.emails.create({
        data: {
          subject: template.versions?.[0].subject,
          to: recipientEmail?.[0],
          sended: true,
          html: renderedHtml,
        },
      });
    } catch (err) {
      console.log('sgMail.send error >>>>>>>> ', err);
      await this.prisma.emails.create({
        data: {
          to: recipientEmail?.[0],
          sended: false,
          subject: template.versions?.[0].subject,
          html: renderedHtml,
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

  private renderDynamicTemplate(html: string, data: Record<string, any>): string {
    return html.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
      return data[key] ?? '';
    });
  }
}
