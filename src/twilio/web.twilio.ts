import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';



@Controller('web/sms')
export class TwilioWebController extends TwilioController {
  constructor(twilioService: TwilioService) {
    super(twilioService);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/send')
  public async sendSMS(@Body() body: { to: string; message: string }) {
    console.log(body, '========>>> body')
    return this.getTwilioService().sendSMS(body.to, body.message);
  }
}
