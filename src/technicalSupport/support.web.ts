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
    try {
      console.log('createSupportTicket -> data >>>>>>>>>>> ', data);

      const supportMetaData = await this.supportService.generateTechnicalSupportMetaData(data);
      console.log('supportMetaData >>>>>>>>>>> ', supportMetaData);

      // Validate the returned data structure
      if (!Array.isArray(supportMetaData) || supportMetaData.length !== 3) {
        console.error('Invalid support metadata format:', supportMetaData);
        throw new Error('Invalid support metadata format received from service');
      }

      const [senderId, receiver, message] = supportMetaData;

      // Validate individual components
      if (!senderId || !receiver || !message) {
        console.error('Missing required support metadata:', { senderId, receiver, message });
        throw new Error('Missing required support metadata components');
      }

      console.log('senderId, receiver, message >>>>>>>>>>> ', senderId, receiver, message);

      return this.messageService.compose(senderId, {
        send_to: receiver,
        subject: 'Technical Support Query',
        content: message,
        attachments: [],
        parent_id: null
      });
    } catch (error) {
      console.error('Error in createSupportTicket:', error);
      throw error; // Re-throw to let the global exception filter handle it
    }
  }
}
