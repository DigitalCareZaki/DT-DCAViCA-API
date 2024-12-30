import { Module } from '@nestjs/common';
import { EducationService } from './education.service';
import { EducationWebController } from './web.education';
import { EducationAppController } from './app.education';

@Module({
  controllers: [EducationWebController, EducationAppController],
  providers: [EducationService],
})
export class EducationModule {}
