import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { WebAdminController } from './web.controller';

@Module({
  providers: [AdminService],
  controllers: [AdminController, WebAdminController],
  exports: [AdminService],
})
export class AdminModule {}
