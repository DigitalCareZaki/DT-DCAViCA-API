import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

import type { HealthRes } from '@types';

@Controller('app/message')
export class MessageAppController extends MessageController {
  constructor(messageService: MessageService) {
    super(messageService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public health(): HealthRes {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
}
