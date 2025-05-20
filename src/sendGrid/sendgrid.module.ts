import { Global, Module } from '@nestjs/common';
import { SendgridService } from './sendgrid.service';
import { SendgridWebController } from './web.sendgrid';

@Global()
@Module({
  controllers: [SendgridWebController],
  providers: [SendgridService],
  exports: [SendgridService],
})
export class SendgridModule { }
