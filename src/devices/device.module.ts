import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceWebController } from './device.web';
import { DeviceAppController } from './device.app';

@Module({
  controllers: [DeviceWebController, DeviceAppController],
  providers: [DeviceService],
})
export class DeviceModule {}
