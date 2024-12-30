import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { WebDepartController } from './web.controller';

@Module({
  controllers: [DepartmentsController, WebDepartController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
