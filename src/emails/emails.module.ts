import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsListener } from './emails.listener';
import { EmailsWebController } from './web.controller';

@Module({
  controllers: [EmailsWebController],
  providers: [EmailsListener, EmailsService],
})
export class EmailsModule {}
