import { Controller } from '@nestjs/common';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';

import { MessageService } from 'src/message/message.service';

@Controller('app/support')
export class SupportAppController extends SupportController {
  constructor(supportServcie: SupportService, messageService: MessageService) {
    super(supportServcie, messageService);
  }
}
