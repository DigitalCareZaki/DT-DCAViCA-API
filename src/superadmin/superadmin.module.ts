import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { SuperAdminWebController } from './web.controller';
import { BranchModule } from 'src/branch/branch.module';
import { LocationModule } from 'src/location/location.module';

@Module({
  controllers: [SuperadminController, SuperAdminWebController],
  providers: [SuperadminService],
  imports: [BranchModule, LocationModule],
})
export class SuperadminModule {}
