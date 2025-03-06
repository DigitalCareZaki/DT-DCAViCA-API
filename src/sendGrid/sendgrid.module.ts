import { Module } from '@nestjs/common';
import { SendgridController } from './sendgrid.controller';
import { SendgridService } from './sendgrid.service';
import { SendgridWebController } from './web.sendgrid';

@Module({
  controllers: [SendgridWebController, SendgridController],
  providers: [SendgridService],
})
export class SendgridModule {}
