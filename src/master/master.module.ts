import { Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { WebMasterController } from './web.controller';

@Module({
  controllers: [MasterController, WebMasterController],
  providers: [MasterService],
})
export class MasterModule {}
