import { Module } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { TelemedWebController } from './web.controller';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { TelemedAppController } from './app.controller';
import { TwilioService } from 'src/twilio/twilio.service';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [TelemedWebController, TelemedAppController],
  providers: [TelemedService, SendgridService, TwilioService, AdminService],
})
export class TelemedModule { }
