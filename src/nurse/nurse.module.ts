import { Module } from '@nestjs/common';
import { NurseService } from './nurse.service';
import { NurseWebController } from './web.controller';
import { NurseAppController } from './app.controller';

@Module({
  controllers: [NurseWebController, NurseAppController],
  providers: [NurseService],
  exports: [NurseService],
})
export class NurseModule {}
