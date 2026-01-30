import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceWebController } from './device.web';
import { DeviceAppController } from './device.app';
import { AdminService } from 'src/admin/admin.service';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';

@Module({
  controllers: [DeviceWebController, DeviceAppController],
  providers: [DeviceService, AdminService, VivalinkWebPortalTokenService],
})
export class DeviceModule { }
