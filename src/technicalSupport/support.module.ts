import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportWebController } from './support.web';
import { MessageModule } from 'src/message/message.module';

@Module({
  controllers: [SupportWebController],
  providers: [SupportService],
  imports: [MessageModule],
})
export class SupportModule { }
