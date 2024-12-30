import { Module } from '@nestjs/common';
import { TabletService } from './tablet.service';
import { TabletWebController } from './tablet.web';
import { TabletAppController } from './tablet.app';

@Module({
  controllers: [TabletWebController, TabletAppController],
  providers: [TabletService],
})
export class TabletModule {}
