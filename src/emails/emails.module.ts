import { Module } from '@nestjs/common';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailsListener } from './emails.listener';
import { EmailsWebController } from './web.controller';

@Module({
  controllers: [EmailsController, EmailsWebController],
  providers: [EmailsListener, EmailsService],
})
export class EmailsModule {}
