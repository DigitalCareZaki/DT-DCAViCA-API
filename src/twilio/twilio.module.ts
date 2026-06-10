import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { TwilioWebController } from './web.twilio';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [TwilioWebController, TwilioController],
  providers: [TwilioService, AdminService],
})
export class TwilioModule { }
