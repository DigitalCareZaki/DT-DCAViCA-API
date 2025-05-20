import { Module } from '@nestjs/common';
import { SendgridService } from './sendgrid.service';
import { SendgridWebController } from './web.sendgrid';

@Module({
  controllers: [SendgridWebController],
  providers: [SendgridService],
})
export class SendgridModule {}
