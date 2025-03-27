import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { TwilioWebController } from './web.twilio';

@Module({
  controllers: [TwilioWebController, TwilioController],
  providers: [TwilioService],
})
export class TwilioModule { }
