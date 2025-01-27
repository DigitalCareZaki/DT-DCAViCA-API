import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportWebController } from './support.web';
import { SupportAppController } from './support.app';

import { MessageModule } from 'src/message/message.module';

@Module({
  controllers: [SupportWebController, SupportAppController],
  providers: [SupportService],
  imports: [MessageModule],
})
export class SupportModule {}
