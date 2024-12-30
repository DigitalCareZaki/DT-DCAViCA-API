import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { ChatService } from './chat.service';

@Controller()
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  public getChatService(): ChatService {
    return this.chatService;
  }
}
