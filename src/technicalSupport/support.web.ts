import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';

import { MessageService } from 'src/message/message.service';

import { SupportDTO } from './dto';

@Controller('web/support')
export class SupportWebController extends SupportController {
  constructor(supportService: SupportService, messageService: MessageService) {
    super(supportService, messageService);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createSupportTicket(@Body() data: SupportDTO) {
    const [senderId, receiver, message] =
      await this.getSupportService().generateTechnicalSupportMetaData(data);

    return this.getMessageService().compose(senderId, {
      send_to: receiver,
      subject: 'Technical Support Query',
      content: message,
      attachments: [],
    });
  }
}
