import { Controller } from '@nestjs/common';

import { SupportService } from './support.service';
import { MessageService } from 'src/message/message.service';

@Controller()
export class SupportController {
  constructor(
    private supportService: SupportService,
    private messageService: MessageService,
  ) {}

  public getSupportService(): SupportService {
    return this.supportService;
  }

  public getMessageService(): MessageService {
    return this.messageService;
  }
}
