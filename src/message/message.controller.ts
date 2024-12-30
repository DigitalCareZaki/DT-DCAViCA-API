import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { MessageService } from './message.service';

@Controller()
@UseGuards(JwtGuard)
export class MessageController {
  constructor(private messageService: MessageService) {}

  public getMessageService(): MessageService {
    return this.messageService;
  }
}
