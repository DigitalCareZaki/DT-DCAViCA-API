import { Module } from '@nestjs/common';
import { EducationService } from './education.service';
import { EducationWebController } from './web.education';
import { EducationAppController } from './app.education';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [EducationWebController, EducationAppController],
  providers: [EducationService, AdminService],
})
export class EducationModule { }
