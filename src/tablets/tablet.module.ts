import { Module } from '@nestjs/common';
import { TabletService } from './tablet.service';
import { TabletWebController } from './tablet.web';
import { TabletAppController } from './tablet.app';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [TabletWebController, TabletAppController],
  providers: [TabletService, AdminService],
})
export class TabletModule { }
