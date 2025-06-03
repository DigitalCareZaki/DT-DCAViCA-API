import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SupportService } from './support.service';
import { MessageService } from 'src/message/message.service';
import { SupportDTO } from './dto';

@Controller('web/support')
export class SupportWebController {
  constructor(private readonly supportService: SupportService, private readonly messageService: MessageService) { }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createSupportTicket(@Body() data: SupportDTO) {
    console.log('createSupportTicket -> data >>>>>>>>>>> ', data);

    const [senderId, receiver, message] = await this.supportService.generateTechnicalSupportMetaData(data);
    console.log('senderId, receiver, message >>>>>>>>>>> ', senderId, receiver, message);

    return this.messageService.compose(senderId, {
      send_to: receiver,
      subject: 'Technical Support Query',
      content: message,
      attachments: [],
      parent_id: null
    });
  }
}
