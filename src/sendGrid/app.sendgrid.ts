import { Controller } from '@nestjs/common';

import { SendgridController } from './sendgrid.controller';
import { SendgridService } from './sendgrid.service';

@Controller('app/sg-mail')
export class SendgridAppController extends SendgridController {
  constructor(sendGridService: SendgridService) {
    super(sendGridService);
  }
}
