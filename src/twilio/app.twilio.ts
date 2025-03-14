import { Controller } from '@nestjs/common';

import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';

@Controller('app/sg-mail')
export class TwilioAppController extends TwilioController {
  constructor(twilioService: TwilioService) {
    super(twilioService);
  }
}
