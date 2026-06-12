import { Module } from '@nestjs/common';
import { SitesWebController } from './sites.web';
import { SitesService } from './sites.service';
import { VivalinkModule } from 'src/vivalink/vivalink.module';
import { AdminService } from 'src/admin/admin.service';

@Module({
  imports: [VivalinkModule],
  controllers: [SitesWebController],
  providers: [SitesService, AdminService],
})
export class SitesModule { }

