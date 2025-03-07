import { Module } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { TelemedWebController } from './web.controller';
import { MailService } from '@sendgrid/mail';
import { SendgridService } from 'src/sendGrid/sendgrid.service';

@Module({
  controllers: [TelemedWebController],
  providers: [TelemedService, SendgridService],
})
export class TelemedModule { }
