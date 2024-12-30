import { Module } from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { TelemedWebController } from './web.controller';

@Module({
  controllers: [TelemedWebController],
  providers: [TelemedService],
})
export class TelemedModule {}
