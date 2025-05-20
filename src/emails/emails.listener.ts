import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transporter, createTransport } from 'nodemailer';

@Injectable()
export class EmailsListener {
  private transporter: Transporter;

  constructor(private readonly prisma: PrismaService) {
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not defined');
    }

    if (!process.env.SMTP_USER) {
      throw new Error('SMTP_USER is not defined');
    }

    if (!process.env.SMTP_PASS) {
      throw new Error('SMTP_PASS is not defined');
    }

    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  @OnEvent('send_email')
  public async handleSendEmailEvent(payload: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: payload.to },
      });

      if (!user) {
        // Either insert a placeholder user, or skip creating the email record
        console.log(`User with email ${payload.to} not found`);
        return;
      }

      // const template = await this.prisma.emailTemplate.findFirst({
      //   where: {
      //     AND: [
      //       {
      //         key: payload.template,
      //       },
      //       {
      //         active: true,
      //       },
      //     ],
      //   },
      //   orderBy: {
      //     created_at: 'desc',
      //   },
      // });

      // const parsedTempate = this.parseEmail(
      //   payload.template,
      //   template.html,
      //   payload.data,
      // );

      // console.log('payload.data >>>>>>>>>>>>>> ', payload);

      // await this.transporter
      //   .sendMail({
      //     from: 'avica@demowebsite.world',
      //     to: payload.to,
      //     subject: template.subject,
      //     html: parsedTempate,
      //   })
      //   .then(async () => {
      //     await this.prisma.emails.create({
      //       data: {
      //         to: payload.to,
      //         sended: true,
      //         subject: template.subject,
      //         html: template.html,
      //       },
      //     });
      //   })
      //   .catch(async (err) => {
      //     await this.prisma.emails.create({
      //       data: {
      //         to: payload.to,
      //         sended: false,
      //         subject: template.subject,
      //         html: template.html,
      //         error: err?.message ?? 'Something went wrong',
      //       },
      //     });

      //     throw err;
      //   });
    } catch (err) {
      console.log(err);
      console.log('Error at sending email');
    }
  }

  // private parseEmail(
  //   type: string,
  //   html: string,
  //   data: { [key: string]: string },
  // ): string {
  //   if (type === 'template:reset-password-request') {
  //     return this.parseResetPassword(html, data);
  //   }

  //   if (type === 'template:onboarding') {
  //     return this.parseOnBoarding(html, data);
  //   }

  //   return '';
  // }

  // private parseResetPassword(
  //   html: string,
  //   data: { [key: string]: string },
  // ): string {
  //   return html.replace('OTPDIGIT', data?.otp);
  // }

  // private parseOnBoarding(
  //   html: string,
  //   data: { [key: string]: string },
  // ): string {
  //   return html.replace('USERNAME', data?.name);
  // }
}
